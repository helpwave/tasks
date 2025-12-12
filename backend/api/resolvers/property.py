import strawberry
from api.context import Info
from api.inputs import (
    CreatePropertyDefinitionInput,
    UpdatePropertyDefinitionInput,
)
from api.types.property import PropertyDefinitionType
from database import models
from sqlalchemy import select


@strawberry.type
class PropertyDefinitionQuery:
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
class PropertyDefinitionMutation:
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
