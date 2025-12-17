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

            query = (
                query.outerjoin(
                    patient_locations,
                    models.Patient.id == patient_locations.c.patient_id,
                )
                .where(
                    (models.Patient.assigned_location_id.in_(select(cte.c.id)))
                    | (patient_locations.c.location_id.in_(select(cte.c.id))),
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
        initial_state = data.state.value if data.state else PatientState.WAIT.value
        new_patient = models.Patient(
            firstname=data.firstname,
            lastname=data.lastname,
            birthdate=data.birthdate,
            sex=data.sex.value,
            state=initial_state,
            assigned_location_id=data.assigned_location_id,
        )

        if data.assigned_location_ids:
            result = await info.context.db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id.in_(data.assigned_location_ids),
                ),
            )
            locations = result.scalars().all()
            new_patient.assigned_locations = list(locations)
        elif data.assigned_location_id:
            result = await info.context.db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == data.assigned_location_id,
                ),
            )
            location = result.scalars().first()
            if location:
                new_patient.assigned_locations = [location]

        if data.properties:
            await process_properties(
                info.context.db,
                new_patient,
                data.properties,
                "patient",
            )

        info.context.db.add(new_patient)
        await info.context.db.commit()

        await info.context.db.refresh(new_patient, ["assigned_locations"])
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
            .options(selectinload(models.Patient.assigned_locations)),
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
        await db.refresh(patient, ["assigned_locations"])
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
            .options(selectinload(models.Patient.assigned_locations)),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.ADMITTED.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        return patient

    @strawberry.mutation
    async def discharge_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(selectinload(models.Patient.assigned_locations)),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.DISCHARGED.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        return patient

    @strawberry.mutation
    async def mark_patient_dead(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(selectinload(models.Patient.assigned_locations)),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.DEAD.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
        return patient

    @strawberry.mutation
    async def wait_patient(self, info: Info, id: strawberry.ID) -> PatientType:
        db = info.context.db
        result = await db.execute(
            select(models.Patient)
            .where(models.Patient.id == id)
            .options(selectinload(models.Patient.assigned_locations)),
        )
        patient = result.scalars().first()
        if not patient:
            raise Exception("Patient not found")
        patient.state = PatientState.WAIT.value
        await db.commit()
        await db.refresh(patient, ["assigned_locations"])
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
