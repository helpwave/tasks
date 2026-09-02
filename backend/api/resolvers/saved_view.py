import json

import strawberry
from graphql import GraphQLError
from sqlalchemy import select

from api.context import Info
from api.errors import raise_unauthenticated
from api.inputs import (
    CreateSavedViewInput,
    UpdateSavedViewInput,
)
from api.services.authorization import AuthorizationService
from api.services.base import BaseRepository
from api.services.scope import (
    PRIVATE,
    apply_scope_update,
    can_read_scoped,
    normalize_root_location_ids,
    resolve_scope_input,
    scoped_visibility_condition,
)
from api.types.saved_view import SavedViewType
from database import models


def _require_user(info: Info) -> models.User:
    user = info.context.user
    if not user:
        raise_unauthenticated("Authentication required")
    return user


def _validated_json(blob: str, label: str) -> str:
    try:
        json.loads(blob)
    except json.JSONDecodeError as e:
        raise GraphQLError(f"Invalid JSON in {label}") from e
    return blob


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
        if not await can_read_scoped(info, user, row):
            raise GraphQLError("Not found or access denied")
        return SavedViewType.from_model(row, current_user_id=user.id)

    @strawberry.field
    async def my_saved_views(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> list[SavedViewType]:
        user = _require_user(info)
        db = info.context.db
        auth_service = AuthorizationService(db)
        scope = await auth_service.get_scope_location_ids(
            user, info.context, normalize_root_location_ids(root_location_ids)
        )
        result = await db.execute(
            select(models.SavedView)
            .where(scoped_visibility_condition(models.SavedView, user.id, scope))
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
        visibility, location_id = await resolve_scope_input(
            info, user, data.visibility, data.location_id
        )
        for blob, label in (
            (data.filter_definition, "filter_definition"),
            (data.sort_definition, "sort_definition"),
            (data.parameters, "parameters"),
            (data.related_filter_definition, "related_filter_definition"),
            (data.related_sort_definition, "related_sort_definition"),
            (data.related_parameters, "related_parameters"),
        ):
            _validated_json(blob, label)

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
            visibility=visibility,
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
            row.filter_definition = _validated_json(
                data.filter_definition, "filter_definition"
            )
        if data.sort_definition is not None:
            row.sort_definition = _validated_json(
                data.sort_definition, "sort_definition"
            )
        if data.parameters is not None:
            row.parameters = _validated_json(data.parameters, "parameters")
        if data.related_filter_definition is not None:
            row.related_filter_definition = _validated_json(
                data.related_filter_definition, "related_filter_definition"
            )
        if data.related_sort_definition is not None:
            row.related_sort_definition = _validated_json(
                data.related_sort_definition, "related_sort_definition"
            )
        if data.related_parameters is not None:
            row.related_parameters = _validated_json(
                data.related_parameters, "related_parameters"
            )
        await apply_scope_update(info, user, row, data.visibility, data.location_id)

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
        if not await can_read_scoped(info, user, src):
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
            location_id=None,
            visibility=PRIVATE,
        )
        db.add(clone)
        await db.commit()
        await db.refresh(clone)
        return SavedViewType.from_model(clone, current_user_id=user.id)
