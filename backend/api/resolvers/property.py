import strawberry
from api.context import Info
from api.inputs import (
    CreatePropertyDefinitionInput,
    UpdatePropertyDefinitionInput,
)
from api.resolvers.base import BaseMutationResolver
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
class PropertyDefinitionMutation(BaseMutationResolver[models.PropertyDefinition]):
    def __init__(self):
        super().__init__(models.PropertyDefinition, "property_definition")

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
        return await self.create_and_notify(info, defn)

    @strawberry.mutation
    async def update_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdatePropertyDefinitionInput,
    ) -> PropertyDefinitionType:
        repo = self.get_repository(info.context.db)
        defn = await repo.get_by_id_or_raise(id, "Property Definition not found")

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

        return await self.update_and_notify(info, defn)

    @strawberry.mutation
    async def delete_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        repo = self.get_repository(info.context.db)
        defn = await repo.get_by_id(id)
        if not defn:
            return False

        await self.delete_entity(info, defn)
        return True
