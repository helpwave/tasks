from collections.abc import AsyncGenerator

import strawberry
from api.context import Info
from api.inputs import (
    CreateLocationNodeInput,
    CreatePatientInput,
    CreatePropertyDefinitionInput,
    CreateTaskInput,
    PropertyValueInput,
    UpdateLocationNodeInput,
    UpdatePatientInput,
    UpdatePropertyDefinitionInput,
    UpdateTaskInput,
)
from api.types.location import LocationNodeType
from api.types.patient import PatientType
from api.types.property import PropertyDefinitionType
from api.types.task import TaskType
from database import models
from database.session import redis_client
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def process_properties(
    db: AsyncSession,
    entity,
    props_data: list[PropertyValueInput],
    entity_kind: str,
):
    if not props_data:
        return
    for p_in in props_data:
        ms_val = (
            ",".join(p_in.multi_select_values)
            if p_in.multi_select_values
            else None
        )
        prop_val = models.PropertyValue(
            definition_id=p_in.definition_id,
            text_value=p_in.text_value,
            number_value=p_in.number_value,
            boolean_value=p_in.boolean_value,
            date_value=p_in.date_value,
            date_time_value=p_in.date_time_value,
            select_value=p_in.select_value,
            multi_select_values=ms_val,
        )
        if entity_kind == "patient":
            prop_val.patient = entity
        elif entity_kind == "task":
            prop_val.task = entity
        db.add(prop_val)


@strawberry.type
class Query:
    @strawberry.field
    async def patient(
        self,
        info: Info,
        id: strawberry.ID,
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

    @strawberry.field
    async def task(self, info: Info, id: strawberry.ID) -> TaskType | None:
        result = await info.context.db.execute(
            select(models.Task).where(models.Task.id == id),
        )

        return result.scalars().first()

    @strawberry.field
    async def tasks(
        self,
        info: Info,
        patient_id: strawberry.ID | None = None,
    ) -> list[TaskType]:
        query = select(models.Task)
        if patient_id:
            query = query.where(models.Task.patient_id == patient_id)
        result = await info.context.db.execute(query)

        return result.scalars().all()

    @strawberry.field
    async def location_roots(self, info: Info) -> list[LocationNodeType]:
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.parent_id == None,
            ),
        )

        return result.scalars().all()

    @strawberry.field
    async def location_node(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> LocationNodeType | None:
        result = await info.context.db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )

        return result.scalars().first()

    @strawberry.field
    async def property_definitions(
        self,
        info: Info,
    ) -> list[PropertyDefinitionType]:
        result = await info.context.db.execute(
            select(models.PropertyDefinition),
        )

        return result.scalars().all()


@strawberry.type
class Mutation:

    @strawberry.mutation
    async def create_patient(
        self,
        info: Info,
        data: CreatePatientInput,
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

    @strawberry.mutation
    async def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        new_task = models.Task(
            title=data.title,
            description=data.description,
            patient_id=data.patient_id,
            assignee_id=data.assignee_id,
        )
        info.context.db.add(new_task)
        if data.properties:
            await process_properties(
                info.context.db,
                new_task,
                data.properties,
                "task",
            )

        await info.context.db.commit()
        await info.context.db.refresh(new_task)

        return new_task

    @strawberry.mutation
    async def update_task(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateTaskInput,
    ) -> TaskType:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            raise Exception("Task not found")

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.done is not None:
            task.done = data.done
        if data.assignee_id is not None:
            task.assignee_id = data.assignee_id

        if data.properties:
            await process_properties(db, task, data.properties, "task")

        await db.commit()
        await db.refresh(task)

        return task

    @strawberry.mutation
    async def delete_task(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.Task).where(models.Task.id == id),
        )
        task = result.scalars().first()
        if not task:
            return False

        await db.delete(task)
        await db.commit()

        return True

    @strawberry.mutation
    async def create_location_node(
        self,
        info: Info,
        data: CreateLocationNodeInput,
    ) -> LocationNodeType:
        node = models.LocationNode(
            title=data.title,
            kind=data.kind.value,
            parent_id=data.parent_id,
        )
        info.context.db.add(node)
        await info.context.db.commit()
        await info.context.db.refresh(node)

        return node

    @strawberry.mutation
    async def update_location_node(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateLocationNodeInput,
    ) -> LocationNodeType:
        db = info.context.db
        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )
        node = result.scalars().first()
        if not node:
            raise Exception("Location not found")

        if data.title is not None:
            node.title = data.title
        if data.kind is not None:
            node.kind = data.kind.value
        if data.parent_id is not None:
            node.parent_id = data.parent_id

        await db.commit()
        await db.refresh(node)

        return node

    @strawberry.mutation
    async def delete_location_node(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )
        node = result.scalars().first()
        if not node:
            return False

        await db.delete(node)
        await db.commit()

        return True

    @strawberry.mutation
    async def create_property_definition(
        self,
        info: Info,
        data: CreatePropertyDefinitionInput,
    ) -> PropertyDefinitionType:
        entities_str = ",".join([e.value for e in data.allowed_entities])
        options_str = ",".join(data.options) if data.options else None

        defn = models.PropertyDefinition(
            name=data.name,
            description=data.description,
            field_type=data.field_type.value,
            options=options_str,
            is_active=data.is_active,
            allowed_entities=entities_str,
        )
        info.context.db.add(defn)
        await info.context.db.commit()
        await info.context.db.refresh(defn)

        return defn

    @strawberry.mutation
    async def update_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdatePropertyDefinitionInput,
    ) -> PropertyDefinitionType:
        db = info.context.db
        result = await db.execute(
            select(models.PropertyDefinition).where(
                models.PropertyDefinition.id == id,
            ),
        )
        defn = result.scalars().first()
        if not defn:
            raise Exception("Property Definition not found")

        if data.name is not None:
            defn.name = data.name
        if data.description is not None:
            defn.description = data.description
        if data.is_active is not None:
            defn.is_active = data.is_active
        if data.options is not None:
            defn.options = ",".join(data.options)
        if data.allowed_entities is not None:
            defn.allowed_entities = ",".join(
                [e.value for e in data.allowed_entities],
            )

        await db.commit()
        await db.refresh(defn)

        return defn

    @strawberry.mutation
    async def delete_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.PropertyDefinition).where(
                models.PropertyDefinition.id == id,
            ),
        )
        defn = result.scalars().first()
        if not defn:
            return False

        await db.delete(defn)
        await db.commit()

        return True


@strawberry.type
class Subscription:
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
