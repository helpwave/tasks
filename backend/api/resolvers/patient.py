from collections.abc import AsyncGenerator

import strawberry
from api.context import Info
from api.inputs import CreatePatientInput, PatientState, UpdatePatientInput
from api.types.patient import PatientType
from database import models
from database.session import redis_client
from sqlalchemy import select
from sqlalchemy.orm import aliased, selectinload

from .utils import process_properties


def validate_location_kind(location: models.LocationNode, expected_kind: str, field_name: str) -> None:
    """Validate that a location has the expected kind."""
    if location.kind.upper() != expected_kind.upper():
        raise Exception(
            f"{field_name} must be a location of kind {expected_kind}, "
            f"but got {location.kind}"
        )


def validate_position_kind(location: models.LocationNode, field_name: str) -> None:
    """Validate that a location is a valid position type."""
    allowed_kinds = {"HOSPITAL", "PRACTICE", "CLINIC", "WARD", "BED", "ROOM"}
    if location.kind.upper() not in allowed_kinds:
        raise Exception(
            f"{field_name} must be a location of kind HOSPITAL, PRACTICE, CLINIC, "
            f"WARD, BED, or ROOM, but got {location.kind}"
        )


def validate_team_kind(location: models.LocationNode, field_name: str) -> None:
    """Validate that a location is a valid team type."""
    allowed_kinds = {"CLINIC", "TEAM", "PRACTICE", "HOSPITAL"}
    if location.kind.upper() not in allowed_kinds:
        raise Exception(
            f"{field_name} must be a location of kind CLINIC, TEAM, PRACTICE, "
            f"or HOSPITAL, but got {location.kind}"
        )


@strawberry.type
class PatientQuery:
    @strawberry.field
    async def patient(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> PatientType | None:
        result = await info.context.db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.tasks),
                selectinload(models.Patient.teams),
            ),
        )
        return result.scalars().first()

    @strawberry.field
    async def patients(
        self,
        info: Info,
        location_node_id: strawberry.ID | None = None,
        states: list[PatientState] | None = None,
    ) -> list[PatientType]:
        query = select(models.Patient).options(
            selectinload(models.Patient.assigned_locations),
            selectinload(models.Patient.tasks),
            selectinload(models.Patient.teams),
        )
        
        if states:
            state_values = [s.value for s in states]
            query = query.where(models.Patient.state.in_(state_values))
        else:
            query = query.where(models.Patient.state == PatientState.ADMITTED.value)
        if location_node_id:
            cte = (
                select(models.LocationNode.id)
                .where(models.LocationNode.id == location_node_id)
                .cte(name="location_descendants", recursive=True)
            )

            parent = select(models.LocationNode.id).join(
                cte,
                models.LocationNode.parent_id == cte.c.id,
            )
            cte = cte.union_all(parent)

            patient_locations = aliased(models.patient_locations)
            patient_teams = aliased(models.patient_teams)

            query = (
                query.outerjoin(
                    patient_locations,
                    models.Patient.id == patient_locations.c.patient_id,
                )
                .outerjoin(
                    patient_teams,
                    models.Patient.id == patient_teams.c.patient_id,
                )
                .where(
                    (models.Patient.assigned_location_id.in_(select(cte.c.id)))
                    | (patient_locations.c.location_id.in_(select(cte.c.id)))
                    | (models.Patient.clinic_id.in_(select(cte.c.id)))
                    | (models.Patient.position_id.in_(select(cte.c.id)))
                    | (patient_teams.c.location_id.in_(select(cte.c.id))),
                )
                .distinct()
            )

        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def recent_patients(
        self,
        info: Info,
        limit: int = 5,
    ) -> list[PatientType]:
        query = (
            select(models.Patient)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.tasks),
                selectinload(models.Patient.teams),
            )
            .limit(limit)
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()


@strawberry.type
class PatientMutation:
    @strawberry.mutation
    async def create_patient(
        self,
        info: Info,
        data: CreatePatientInput,
    ) -> PatientType:
        db = info.context.db
        initial_state = data.state.value if data.state else PatientState.WAIT.value
        
        clinic_result = await db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == data.clinic_id,
            ),
        )
        clinic = clinic_result.scalars().first()
        if not clinic:
            raise Exception(f"Clinic location with id {data.clinic_id} not found")
        validate_location_kind(clinic, "CLINIC", "clinic_id")

        position = None
        if data.position_id:
            position_result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.position_id,
                ),
            )
            position = position_result.scalars().first()
            if not position:
                raise Exception(f"Position location with id {data.position_id} not found")
            validate_position_kind(position, "position_id")

        teams = []
        if data.team_ids:
            teams_result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id.in_(data.team_ids),
                ),
            )
            teams = list(teams_result.scalars().all())
            if len(teams) != len(data.team_ids):
                found_ids = {t.id for t in teams}
                missing_ids = set(data.team_ids) - found_ids
                raise Exception(f"Team locations with ids {missing_ids} not found")
            for team in teams:
                validate_team_kind(team, "team_ids")

        new_patient = models.Patient(
            firstname=data.firstname,
            lastname=data.lastname,
            birthdate=data.birthdate,
            sex=data.sex.value,
            state=initial_state,
            assigned_location_id=data.assigned_location_id,
            clinic_id=data.clinic_id,
            position_id=data.position_id,
        )

        if teams:
            new_patient.teams = teams

        if data.assigned_location_ids:
            result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id.in_(data.assigned_location_ids),
                ),
            )
            locations = result.scalars().all()
            new_patient.assigned_locations = list(locations)
        elif data.assigned_location_id:
            result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.assigned_location_id,
                ),
            )
            location = result.scalars().first()
            if location:
                new_patient.assigned_locations = [location]

        if data.properties:
            await process_properties(
                db,
                new_patient,
                data.properties,
                "patient",
            )

        db.add(new_patient)
        await db.commit()

        await db.refresh(new_patient, ["assigned_locations", "teams"])
        await redis_client.publish("patient_created", new_patient.id)
        return new_patient

    @strawberry.mutation
    async def update_patient(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdatePatientInput,
    ) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")

        if data.firstname is not None:
            patient.firstname = data.firstname
        if data.lastname is not None:
            patient.lastname = data.lastname
        if data.birthdate is not None:
            patient.birthdate = data.birthdate
        if data.sex is not None:
            patient.sex = data.sex.value

        if data.clinic_id is not None:
            clinic_result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.clinic_id,
                ),
            )
            clinic = clinic_result.scalars().first()
            if not clinic:
                raise Exception(f"Clinic location with id {data.clinic_id} not found")
            validate_location_kind(clinic, "CLINIC", "clinic_id")
            patient.clinic_id = data.clinic_id

        if data.position_id is not None:
            position_result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.position_id,
                ),
            )
            position = position_result.scalars().first()
            if not position:
                raise Exception(f"Position location with id {data.position_id} not found")
            validate_position_kind(position, "position_id")
            patient.position_id = data.position_id

        if data.team_ids is not None:
            if len(data.team_ids) == 0:
                patient.teams = []
            else:
                teams_result = await db.execute(
                    select(models.LocationNode).where(
                        models.LocationNode.id.in_(data.team_ids),
                    ),
                )
                teams = list(teams_result.scalars().all())
                if len(teams) != len(data.team_ids):
                    found_ids = {t.id for t in teams}
                    missing_ids = set(data.team_ids) - found_ids
                    raise Exception(f"Team locations with ids {missing_ids} not found")
                for team in teams:
                    validate_team_kind(team, "team_ids")
                patient.teams = teams

        if data.assigned_location_ids is not None:
            result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id.in_(data.assigned_location_ids),
                ),
            )
            locations = result.scalars().all()
            patient.assigned_locations = list(locations)
        elif data.assigned_location_id is not None:
            result = await db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.assigned_location_id,
                ),
            )
            location = result.scalars().first()
            if location:
                patient.assigned_locations = [location]
            else:
                patient.assigned_locations = []

        if data.properties:
            await process_properties(db, patient, data.properties, "patient")

        await db.commit()
        await db.refresh(patient, ["assigned_locations", "teams"])
        await redis_client.publish("patient_updated", patient.id)
        return patient

    @strawberry.mutation
    async def delete_patient(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.Patient).where(models.Patient.id == id),
        )
        patient = result.scalars().first()
        if not patient:
            return False
        await db.delete(patient)
        await db.commit()
        return True

    @strawberry.mutation
    async def admit_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.ADMITTED.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        await redis_client.publish("patient_updated", patient.id)
        await redis_client.publish("patient_state_changed", patient.id)
        return patient

    @strawberry.mutation
    async def discharge_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.DISCHARGED.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        await redis_client.publish("patient_updated", patient.id)
        await redis_client.publish("patient_state_changed", patient.id)
        return patient

    @strawberry.mutation
    async def mark_patient_dead(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.DEAD.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        await redis_client.publish("patient_updated", patient.id)
        await redis_client.publish("patient_state_changed", patient.id)
        return patient

    @strawberry.mutation
    async def wait_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(
                selectinload(models.Patient.assigned_locations),
                selectinload(models.Patient.teams),
            ),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.WAIT.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        await redis_client.publish("patient_updated", patient.id)
        await redis_client.publish("patient_state_changed", patient.id)
        return patient


@strawberry.type
class PatientSubscription:
    @strawberry.subscription
    async def patient_created(
        self,
        info: Info,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("patient_created")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.close()

    @strawberry.subscription
    async def patient_updated(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("patient_updated")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    patient_id_str = message["data"]
                    if patient_id is None or patient_id_str == patient_id:
                        yield patient_id_str
        finally:
            await pubsub.close()

    @strawberry.subscription
    async def patient_state_changed(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("patient_state_changed")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    patient_id_str = message["data"]
                    if patient_id is None or patient_id_str == patient_id:
                        yield patient_id_str
        finally:
            await pubsub.close()
