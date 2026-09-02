import json

import strawberry
from graphql import GraphQLError
from sqlalchemy import select

from api.context import Info
from api.errors import raise_unauthenticated
from api.services.authorization import AuthorizationService
from api.services.base import BaseRepository
from api.inputs import (
    CreateSavedViewInput,
    SavedViewVisibility,
    UpdateSavedViewInput,
)
from api.types.saved_view import SavedViewType
from database import models


def _require_user(info: Info) -> models.User:
    user = info.context.user
    if not user:
        raise_unauthenticated("Authentication required")
    return user


async def _can_read_shared(
    info: Info,
    user: models.User,
    row: models.SavedView,
) -> bool:
    if row.owner_user_id == user.id:
        return True
    if row.visibility != SavedViewVisibility.LINK_SHARED.value:
        return False
    if not row.location_id:
        return False
    auth_service = AuthorizationService(info.context.db)
    return await auth_service.can_access_location(
        user, row.location_id, info.context
    )


async def _resolve_scope_location(
    info: Info,
    user: models.User,
    requested_location_id: strawberry.ID | None,
) -> str | None:
    auth_service = AuthorizationService(info.context.db)
    if requested_location_id is not None:
        if not await auth_service.can_access_location(
            user, str(requested_location_id), info.context
        ):
            from api.errors import raise_forbidden

            raise_forbidden()
        return str(requested_location_id)
    return await auth_service.default_scope_location_id(user, info.context)


@strawberry.type
class SavedViewQuery:
    @strawberry.field
    async def saved_view(self, info: Info, id: strawberry.ID) -> SavedViewType | None:
        user = _require_user(info)
        db = info.context.db
        result = await db.execute(
            select(models.SavedView).where(models.SavedView.id == str(id))
        )
        row = result.scalars().first()
        if not row:
            return None
        if not await _can_read_shared(info, user, row):
            raise GraphQLError("Not found or access denied")
        return SavedViewType.from_model(row, current_user_id=user.id)

    @strawberry.field
    async def my_saved_views(self, info: Info) -> list[SavedViewType]:
        user = _require_user(info)
        db = info.context.db
        result = await db.execute(
            select(models.SavedView)
            .where(models.SavedView.owner_user_id == user.id)
            .order_by(models.SavedView.updated_at.desc())
        )
        rows = result.scalars().all()
        return [SavedViewType.from_model(r, current_user_id=user.id) for r in rows]


@strawberry.type
class SavedViewMutation:
    @strawberry.mutation
    async def create_saved_view(
        self,
        info: Info,
        data: CreateSavedViewInput,
    ) -> SavedViewType:
        user = _require_user(info)
        location_id = await _resolve_scope_location(info, user, data.location_id)
        for blob, label in (
            (data.filter_definition, "filter_definition"),
            (data.sort_definition, "sort_definition"),
            (data.parameters, "parameters"),
            (data.related_filter_definition, "related_filter_definition"),
            (data.related_sort_definition, "related_sort_definition"),
            (data.related_parameters, "related_parameters"),
        ):
            try:
                json.loads(blob)
            except json.JSONDecodeError as e:
                raise GraphQLError(f"Invalid JSON in {label}") from e

        row = models.SavedView(
            name=data.name.strip(),
            base_entity_type=data.base_entity_type.value,
            filter_definition=data.filter_definition,
            sort_definition=data.sort_definition,
            parameters=data.parameters,
            related_filter_definition=data.related_filter_definition,
            related_sort_definition=data.related_sort_definition,
            related_parameters=data.related_parameters,
            owner_user_id=user.id,
            location_id=location_id,
            visibility=data.visibility.value,
        )
        info.context.db.add(row)
        await info.context.db.commit()
        await info.context.db.refresh(row)
        return SavedViewType.from_model(row, current_user_id=user.id)

    @strawberry.mutation
    async def update_saved_view(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateSavedViewInput,
    ) -> SavedViewType:
        user = _require_user(info)
        db = info.context.db
        result = await db.execute(
            select(models.SavedView).where(models.SavedView.id == str(id))
        )
        row = result.scalars().first()
        if not row:
            raise GraphQLError("View not found")
        if row.owner_user_id != user.id:
            raise GraphQLError("Forbidden")

        if data.name is not None:
            row.name = data.name.strip()
        if data.filter_definition is not None:
            try:
                json.loads(data.filter_definition)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in filter_definition") from e
            row.filter_definition = data.filter_definition
        if data.sort_definition is not None:
            try:
                json.loads(data.sort_definition)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in sort_definition") from e
            row.sort_definition = data.sort_definition
        if data.parameters is not None:
            try:
                json.loads(data.parameters)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in parameters") from e
            row.parameters = data.parameters
        if data.related_filter_definition is not None:
            try:
                json.loads(data.related_filter_definition)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in related_filter_definition") from e
            row.related_filter_definition = data.related_filter_definition
        if data.related_sort_definition is not None:
            try:
                json.loads(data.related_sort_definition)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in related_sort_definition") from e
            row.related_sort_definition = data.related_sort_definition
        if data.related_parameters is not None:
            try:
                json.loads(data.related_parameters)
            except json.JSONDecodeError as e:
                raise GraphQLError("Invalid JSON in related_parameters") from e
            row.related_parameters = data.related_parameters
        if data.visibility is not None:
            row.visibility = data.visibility.value

        await db.commit()
        await db.refresh(row)
        return SavedViewType.from_model(row, current_user_id=user.id)

    @strawberry.mutation
    async def delete_saved_view(self, info: Info, id: strawberry.ID) -> bool:
        user = _require_user(info)
        db = info.context.db
        result = await db.execute(
            select(models.SavedView).where(models.SavedView.id == str(id))
        )
        row = result.scalars().first()
        if not row:
            return False
        if row.owner_user_id != user.id:
            raise GraphQLError("Forbidden")
        repo = BaseRepository(db, models.SavedView)
        await repo.delete(row)
        return True

    @strawberry.mutation
    async def duplicate_saved_view(
        self,
        info: Info,
        id: strawberry.ID,
        name: str,
    ) -> SavedViewType:
        user = _require_user(info)
        db = info.context.db
        result = await db.execute(
            select(models.SavedView).where(models.SavedView.id == str(id))
        )
        src = result.scalars().first()
        if not src:
            raise GraphQLError("View not found")
        if not await _can_read_shared(info, user, src):
            raise GraphQLError("Not found or access denied")

        clone = models.SavedView(
            name=name.strip(),
            base_entity_type=src.base_entity_type,
            filter_definition=src.filter_definition,
            sort_definition=src.sort_definition,
            parameters=src.parameters,
            related_filter_definition=src.related_filter_definition,
            related_sort_definition=src.related_sort_definition,
            related_parameters=src.related_parameters,
            owner_user_id=user.id,
            location_id=await _resolve_scope_location(info, user, None),
            visibility=SavedViewVisibility.PRIVATE.value,
        )
        db.add(clone)
        await db.commit()
        await db.refresh(clone)
        return SavedViewType.from_model(clone, current_user_id=user.id)
