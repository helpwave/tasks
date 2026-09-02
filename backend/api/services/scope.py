from __future__ import annotations

from typing import Any

import strawberry
from graphql import GraphQLError
from sqlalchemy import and_, or_, select

from api.context import Info
from api.errors import raise_forbidden
from api.inputs import ScopeVisibility
from api.services.authorization import AuthorizationService
from database import models

PRIVATE = ScopeVisibility.PRIVATE.value
PUBLIC = ScopeVisibility.PUBLIC.value


def normalize_root_location_ids(
    root_location_ids: list[strawberry.ID] | None,
) -> list[str] | None:
    if not root_location_ids:
        return None
    return [str(lid) for lid in root_location_ids]


def scoped_visibility_condition(
    model: Any,
    user_id: str | None,
    scope_location_ids: set[str],
):
    public_reachable = and_(
        model.visibility == PUBLIC,
        or_(
            model.location_id.is_(None),
            model.location_id.in_(scope_location_ids) if scope_location_ids else False,
        ),
    )
    if user_id is None:
        return public_reachable
    return or_(model.owner_user_id == user_id, public_reachable)


async def can_read_scoped(info: Info, user: models.User | None, row: Any) -> bool:
    if not user:
        return False
    owner_user_id = getattr(row, "owner_user_id", None)
    if owner_user_id is not None and owner_user_id == user.id:
        return True
    if row.visibility != PUBLIC:
        return False
    if row.location_id is None:
        return True
    auth_service = AuthorizationService(info.context.db)
    scope = await auth_service.get_scope_location_ids(user, info.context)
    return row.location_id in scope


async def resolve_scope_input(
    info: Info,
    user: models.User,
    visibility: ScopeVisibility,
    location_id: strawberry.ID | str | None,
) -> tuple[str, str | None]:
    if visibility == ScopeVisibility.PRIVATE:
        return PRIVATE, None
    auth_service = AuthorizationService(info.context.db)
    if location_id is None:
        default_location_id = await auth_service.default_scope_location_id(
            user, info.context
        )
        if default_location_id is None:
            raise GraphQLError(
                "A location is required to share this entry.",
                extensions={"code": "BAD_REQUEST"},
            )
        return PUBLIC, default_location_id
    if not await auth_service.can_access_location(
        user, str(location_id), info.context
    ):
        raise_forbidden()
    return PUBLIC, str(location_id)


async def apply_scope_update(
    info: Info,
    user: models.User,
    row: Any,
    visibility: ScopeVisibility | None,
    location_id: strawberry.ID | None,
) -> None:
    if visibility is None and location_id is None:
        return
    target_visibility = (
        visibility if visibility is not None else ScopeVisibility(row.visibility)
    )
    target_location_id = (
        str(location_id) if location_id is not None else row.location_id
    )
    row.visibility, row.location_id = await resolve_scope_input(
        info, user, target_visibility, target_location_id
    )


async def can_manage_property_definition(
    info: Info,
    user: models.User | None,
    defn: models.PropertyDefinition,
) -> bool:
    if not user:
        return False
    if defn.visibility != PUBLIC:
        return defn.owner_user_id is not None and defn.owner_user_id == user.id
    if defn.location_id is None:
        return False
    auth_service = AuthorizationService(info.context.db)
    return await auth_service.can_access_location(
        user, defn.location_id, info.context
    )


async def load_scope_location(
    info: Info,
    location_id: str | None,
) -> models.LocationNode | None:
    if not location_id:
        return None
    result = await info.context.db.execute(
        select(models.LocationNode).where(models.LocationNode.id == location_id),
    )
    return result.scalars().first()
