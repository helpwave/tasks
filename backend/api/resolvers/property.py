import strawberry
from api.context import Info
from api.errors import raise_forbidden, raise_unauthenticated
from api.inputs import (
    CreatePropertyDefinitionInput,
    UpdatePropertyDefinitionInput,
)
from api.resolvers.base import BaseMutationResolver
from api.services.authorization import AuthorizationService
from api.types.property import PropertyDefinitionType
from database import models
from graphql import GraphQLError
from sqlalchemy import or_, select


def _require_user(info: Info) -> models.User:
    user = info.context.user
    if not user:
        raise_unauthenticated()
    return user


@strawberry.type
class PropertyDefinitionQuery:
    @strawberry.field
    async def property_definitions(
        self,
        info: Info,
    ) -> list[PropertyDefinitionType]:
        user = _require_user(info)
        auth_service = AuthorizationService(info.context.db)
        accessible = await auth_service.get_user_accessible_location_ids(
            user, info.context
        )
        conditions = [models.PropertyDefinition.location_id.is_(None)]
        if accessible:
            conditions.append(
                models.PropertyDefinition.location_id.in_(accessible)
            )
        result = await info.context.db.execute(
            select(models.PropertyDefinition).where(or_(*conditions)),
        )
        return result.scalars().all()


@strawberry.type
class PropertyDefinitionMutation(
    BaseMutationResolver[models.PropertyDefinition]
):
    pass

    @strawberry.mutation
    async def create_property_definition(
        self,
        info: Info,
        data: CreatePropertyDefinitionInput,
    ) -> PropertyDefinitionType:
        user = _require_user(info)
        auth_service = AuthorizationService(info.context.db)

        if data.location_id is not None:
            if not await auth_service.can_access_location(
                user, str(data.location_id), info.context
            ):
                raise_forbidden()
            location_id = str(data.location_id)
        else:
            location_id = await auth_service.default_scope_location_id(
                user, info.context
            )
            if location_id is None:
                raise_forbidden(
                    "You must belong to a location to create property definitions."
                )

        entities_str = ",".join([e.value for e in data.allowed_entities])
        options_str = ",".join(data.options) if data.options else None

        defn = models.PropertyDefinition(
            name=data.name,
            description=data.description,
            field_type=data.field_type.value,
            options=options_str,
            is_active=data.is_active,
            allowed_entities=entities_str,
            location_id=location_id,
        )
        return await BaseMutationResolver.create_and_notify(
            info, defn, models.PropertyDefinition, "property_definition"
        )

    @strawberry.mutation
    async def update_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdatePropertyDefinitionInput,
    ) -> PropertyDefinitionType:
        user = _require_user(info)
        db = info.context.db
        repo = BaseMutationResolver.get_repository(db, models.PropertyDefinition)
        defn = await repo.get_by_id_or_raise(
            id, "Property Definition not found"
        )
        await _require_definition_scope(info, user, defn)

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

        return await BaseMutationResolver.update_and_notify(
            info, defn, models.PropertyDefinition, "property_definition"
        )

    @strawberry.mutation
    async def delete_property_definition(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = _require_user(info)
        db = info.context.db
        repo = BaseMutationResolver.get_repository(db, models.PropertyDefinition)
        defn = await repo.get_by_id(id)
        if not defn:
            return False
        await _require_definition_scope(info, user, defn)

        await BaseMutationResolver.delete_entity(
            info, defn, models.PropertyDefinition, "property_definition"
        )
        return True


async def _require_definition_scope(
    info: Info,
    user: models.User,
    defn: models.PropertyDefinition,
) -> None:
    if defn.location_id is None:
        raise_forbidden(
            "This property definition is global and cannot be modified. "
            "Recreate it within a location to manage it."
        )
    auth_service = AuthorizationService(info.context.db)
    if not await auth_service.can_access_location(
        user, defn.location_id, info.context
    ):
        raise_forbidden()


async def user_can_use_definition(
    info: Info,
    definition_id: str,
) -> bool:
    user = info.context.user
    if not user:
        return False
    db = info.context.db
    result = await db.execute(
        select(models.PropertyDefinition.location_id).where(
            models.PropertyDefinition.id == str(definition_id),
        )
    )
    row = result.first()
    if row is None:
        raise GraphQLError(
            "Property definition not found.",
            extensions={"code": "BAD_REQUEST"},
        )
    location_id = row[0]
    if location_id is None:
        return True
    auth_service = AuthorizationService(db)
    return await auth_service.can_access_location(user, location_id, info.context)


async def validate_property_value_inputs(info: Info, props) -> None:
    if not props:
        return
    for prop in props:
        if not await user_can_use_definition(info, str(prop.definition_id)):
            raise_forbidden(
                "You cannot use one or more of the selected property definitions."
            )
