from collections.abc import AsyncGenerator

import strawberry
from api.context import Info
from api.inputs import CreatePatientInput, UpdatePatientInput
from api.types.patient import PatientType
from database import models
from database.session import redis_client
from sqlalchemy import select

from .utils import process_properties


@strawberry.type
class PatientQuery:
    @strawberry.field
    async def patient(
        self, info: Info, id: strawberry.ID
    ) -> PatientType | None:
        result = await info.context.db.execute(
            select(models.Patient).where(models.Patient.id == id),
        )
        return result.scalars().first()

    @strawberry.field
    async def patients(
        self,
        info: Info,
        location_node_id: strawberry.ID | None = None,
    ) -> list[PatientType]:
        query = select(models.Patient)
        if location_node_id:
            query = query.where(
                models.Patient.assigned_location_id == location_node_id,
            )
        result = await info.context.db.execute(query)
        return result.scalars().all()


@strawberry.type
class PatientMutation:
    @strawberry.mutation
    async def create_patient(
        self, info: Info, data: CreatePatientInput
    ) -> PatientType:
        new_patient = models.Patient(
            firstname=data.firstname,
            lastname=data.lastname,
            birthdate=data.birthdate,
            gender=data.gender.value,
            assigned_location_id=data.assigned_location_id,
        )
        info.context.db.add(new_patient)
        if data.properties:
            await process_properties(
                info.context.db,
                new_patient,
                data.properties,
                "patient",
            )

        await info.context.db.commit()
        await info.context.db.refresh(new_patient)
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
            select(models.Patient).where(models.Patient.id == id),
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
        if data.gender is not None:
            patient.gender = data.gender.value
        if data.assigned_location_id is not None:
            patient.assigned_location_id = data.assigned_location_id

        if data.properties:
            await process_properties(db, patient, data.properties, "patient")

        await db.commit()
        await db.refresh(patient)
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


@strawberry.type
class PatientSubscription:
    @strawberry.subscription
    async def patient_created(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("patient_created")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.close()
