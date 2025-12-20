from collections.abc import AsyncGenerator

import strawberry
from api.audit import audit_log
from api.context import Info
from api.inputs import CreatePatientInput, PatientState, UpdatePatientInput
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.checksum import validate_checksum
from api.services.location import LocationService
from api.services.property import PropertyService
from api.types.patient import PatientType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import aliased, selectinload


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
class PatientMutation(BaseMutationResolver[models.Patient]):
    def __init__(self):
        super().__init__(models.Patient, "patient")

    def _get_property_service(self, db) -> PropertyService:
        return PropertyService(db)

    def _get_location_service(self, db) -> LocationService:
        return LocationService(db)

    @strawberry.mutation
    @audit_log("create_patient")
    async def create_patient(
        self,
        info: Info,
        data: CreatePatientInput,
    ) -> PatientType:
        db = info.context.db
        location_service = self._get_location_service(db)
        initial_state = data.state.value if data.state else PatientState.WAIT.value

        await location_service.validate_and_get_clinic(data.clinic_id)

        if data.position_id:
            await location_service.validate_and_get_position(data.position_id)

        teams = []
        if data.team_ids:
            teams = await location_service.validate_and_get_teams(data.team_ids)

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
            locations = await location_service.get_locations_by_ids(data.assigned_location_ids)
            new_patient.assigned_locations = locations
        elif data.assigned_location_id:
            location = await location_service.get_location_by_id(data.assigned_location_id)
            new_patient.assigned_locations = [location] if location else []

        if data.properties:
            property_service = self._get_property_service(db)
            await property_service.process_properties(new_patient, data.properties, "patient")

        repo = self.get_repository(db)
        await repo.create(new_patient)
        await db.refresh(new_patient, ["assigned_locations", "teams"])
        await self.create_and_notify(info, new_patient)
        return new_patient

    @strawberry.mutation
    @audit_log("update_patient")
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

        if data.checksum:
            validate_checksum(patient, data.checksum, "Patient")

        if data.firstname is not None:
            patient.firstname = data.firstname
        if data.lastname is not None:
            patient.lastname = data.lastname
        if data.birthdate is not None:
            patient.birthdate = data.birthdate
        if data.sex is not None:
            patient.sex = data.sex.value

        location_service = self._get_location_service(db)

        if data.clinic_id is not None:
            await location_service.validate_and_get_clinic(data.clinic_id)
            patient.clinic_id = data.clinic_id

        if data.position_id is not strawberry.UNSET:
            if data.position_id is None:
                patient.position_id = None
            else:
                await location_service.validate_and_get_position(data.position_id)
                patient.position_id = data.position_id

        if data.team_ids is not strawberry.UNSET:
            if data.team_ids is None or len(data.team_ids) == 0:
                patient.teams = []
            else:
                patient.teams = await location_service.validate_and_get_teams(data.team_ids)

        if data.assigned_location_ids is not None:
            locations = await location_service.get_locations_by_ids(data.assigned_location_ids)
            patient.assigned_locations = locations
        elif data.assigned_location_id is not None:
            location = await location_service.get_location_by_id(data.assigned_location_id)
            patient.assigned_locations = [location] if location else []

        if data.properties:
            property_service = self._get_property_service(db)
            await property_service.process_properties(patient, data.properties, "patient")

        await self.update_and_notify(info, patient)
        await db.refresh(patient, ["assigned_locations", "teams"])
        return patient

    @strawberry.mutation
    @audit_log("delete_patient")
    async def delete_patient(self, info: Info, id: strawberry.ID) -> bool:
        repo = self.get_repository(info.context.db)
        patient = await repo.get_by_id(id)
        if not patient:
            return False
        await self.delete_entity(info, patient)
        return True

    async def _update_patient_state(
        self,
        info: Info,
        id: strawberry.ID,
        state: PatientState,
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
        patient.state = state.value
        await self.update_and_notify(info, patient)
        await db.refresh(patient, ["assigned_locations"])
        from api.services.notifications import notify_entity_update
        await notify_entity_update("patient_state_changed", patient.id)
        return patient

    @strawberry.mutation
    @audit_log("admit_patient")
    async def admit_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        return await self._update_patient_state(info, id, PatientState.ADMITTED)

    @strawberry.mutation
    @audit_log("discharge_patient")
    async def discharge_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        return await self._update_patient_state(info, id, PatientState.DISCHARGED)

    @strawberry.mutation
    @audit_log("mark_patient_dead")
    async def mark_patient_dead(self, info: Info, id: strawberry.ID) -> PatientType:
        return await self._update_patient_state(info, id, PatientState.DEAD)

    @strawberry.mutation
    @audit_log("wait_patient")
    async def wait_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        return await self._update_patient_state(info, id, PatientState.WAIT)


@strawberry.type
class PatientSubscription(BaseSubscriptionResolver):
    def __init__(self):
        super().__init__("patient")

    @strawberry.subscription
    async def patient_created(self, info: Info) -> AsyncGenerator[strawberry.ID, None]:
        async for patient_id in self.entity_created(info):
            yield patient_id

    @strawberry.subscription
    async def patient_updated(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in self.entity_updated(info, patient_id):
            yield updated_id

    @strawberry.subscription
    async def patient_state_changed(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        from api.services.subscription import create_redis_subscription
        async for updated_id in create_redis_subscription("patient_state_changed", patient_id):
            yield updated_id
