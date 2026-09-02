import re
import uuid

import strawberry
from graphql import GraphQLError
from sqlalchemy import select

from api.context import Info
from api.errors import raise_forbidden
from api.inputs import CreateTaskPresetInput, UpdateTaskPresetInput
from api.services.authorization import AuthorizationService
from api.services.scope import (
    apply_scope_update,
    can_read_scoped,
    normalize_root_location_ids,
    resolve_scope_input,
    scoped_visibility_condition,
)
from api.services.task_graph import (
    graph_dict_from_preset_inputs,
    validate_task_graph_dict,
)
from api.types.task_preset import TaskPresetType, task_preset_type_from_model
from database import models


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip()).lower().strip("-")
    return s or "preset"


async def _key_is_available(
    db,
    key: str,
    exclude_id: str | None = None,
) -> bool:
    q = select(models.TaskPreset).where(models.TaskPreset.key == key)
    if exclude_id:
        q = q.where(models.TaskPreset.id != exclude_id)
    r = await db.execute(q)
    return r.scalars().first() is None


async def _generate_unique_key(db, name: str) -> str:
    base = f"{_slugify(name)}-{uuid.uuid4().hex[:8]}"
    if await _key_is_available(db, base):
        return base
    for _ in range(20):
        candidate = f"{_slugify(name)}-{uuid.uuid4().hex[:8]}"
        if await _key_is_available(db, candidate):
            return candidate
    raise GraphQLError(
        "Could not allocate a unique preset key",
        extensions={"code": "BAD_REQUEST"},
    )


def _can_edit_preset(
    preset: models.TaskPreset,
    user_id: str,
) -> bool:
    return preset.owner_user_id is not None and preset.owner_user_id == user_id


def _can_delete_preset(
    preset: models.TaskPreset,
    user_id: str,
) -> bool:
    return preset.owner_user_id is not None and preset.owner_user_id == user_id


def _require_user(info: Info) -> models.User:
    user = info.context.user
    if not user:
        raise GraphQLError(
            "Not authenticated",
            extensions={"code": "UNAUTHENTICATED"},
        )
    return user


async def _readable_preset_or_raise(
    info: Info,
    user: models.User,
    query,
) -> models.TaskPreset | None:
    r = await info.context.db.execute(query)
    preset = r.scalars().first()
    if not preset:
        return None
    if not await can_read_scoped(info, user, preset):
        raise_forbidden()
    return preset


@strawberry.type
class TaskPresetQuery:
    @strawberry.field
    async def task_presets(
        self,
        info: Info,
        root_location_ids: list[strawberry.ID] | None = None,
    ) -> list[TaskPresetType]:
        user = _require_user(info)
        auth_service = AuthorizationService(info.context.db)
        scope = await auth_service.get_scope_location_ids(
            user, info.context, normalize_root_location_ids(root_location_ids)
        )
        q = (
            select(models.TaskPreset)
            .where(scoped_visibility_condition(models.TaskPreset, user.id, scope))
            .order_by(models.TaskPreset.name)
        )
        r = await info.context.db.execute(q)
        rows = r.scalars().all()
        return [
            task_preset_type_from_model(p, current_user_id=user.id) for p in rows
        ]

    @strawberry.field
    async def task_preset(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> TaskPresetType | None:
        user = _require_user(info)
        preset = await _readable_preset_or_raise(
            info,
            user,
            select(models.TaskPreset).where(models.TaskPreset.id == id),
        )
        if not preset:
            return None
        return task_preset_type_from_model(preset, current_user_id=user.id)

    @strawberry.field
    async def task_preset_by_key(
        self,
        info: Info,
        key: str,
    ) -> TaskPresetType | None:
        user = _require_user(info)
        preset = await _readable_preset_or_raise(
            info,
            user,
            select(models.TaskPreset).where(models.TaskPreset.key == key),
        )
        if not preset:
            return None
        return task_preset_type_from_model(preset, current_user_id=user.id)


@strawberry.type
class TaskPresetMutation:
    @strawberry.mutation
    async def create_task_preset(
        self,
        info: Info,
        data: CreateTaskPresetInput,
    ) -> TaskPresetType:
        user = _require_user(info)
        graph_dict = graph_dict_from_preset_inputs(data.graph.nodes, data.graph.edges)
        validate_task_graph_dict(graph_dict)
        visibility, location_id = await resolve_scope_input(
            info, user, data.visibility, data.location_id
        )
        if data.key:
            if not await _key_is_available(info.context.db, data.key):
                raise GraphQLError(
                    "Preset key already exists",
                    extensions={"code": "BAD_REQUEST"},
                )
            key = data.key
        else:
            key = await _generate_unique_key(info.context.db, data.name)
        preset = models.TaskPreset(
            name=data.name,
            key=key,
            visibility=visibility,
            owner_user_id=user.id,
            location_id=location_id,
            graph_json=graph_dict,
        )
        info.context.db.add(preset)
        await info.context.db.commit()
        await info.context.db.refresh(preset)
        return task_preset_type_from_model(preset, current_user_id=user.id)

    @strawberry.mutation
    async def update_task_preset(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateTaskPresetInput,
    ) -> TaskPresetType:
        user = _require_user(info)
        r = await info.context.db.execute(
            select(models.TaskPreset).where(models.TaskPreset.id == id),
        )
        preset = r.scalars().first()
        if not preset:
            raise GraphQLError(
                "Preset not found",
                extensions={"code": "NOT_FOUND"},
            )
        if not _can_edit_preset(preset, user.id):
            raise_forbidden()
        if data.key is not None:
            if not await _key_is_available(info.context.db, data.key, str(id)):
                raise GraphQLError(
                    "Preset key already exists",
                    extensions={"code": "BAD_REQUEST"},
                )
            preset.key = data.key
        if data.name is not None:
            preset.name = data.name
        if data.graph is not None:
            graph_dict = graph_dict_from_preset_inputs(data.graph.nodes, data.graph.edges)
            validate_task_graph_dict(graph_dict)
            preset.graph_json = graph_dict
        await apply_scope_update(info, user, preset, data.visibility, data.location_id)
        await info.context.db.commit()
        await info.context.db.refresh(preset)
        return task_preset_type_from_model(preset, current_user_id=user.id)

    @strawberry.mutation
    async def delete_task_preset(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = _require_user(info)
        r = await info.context.db.execute(
            select(models.TaskPreset).where(models.TaskPreset.id == id),
        )
        preset = r.scalars().first()
        if not preset:
            raise GraphQLError(
                "Preset not found",
                extensions={"code": "NOT_FOUND"},
            )
        if not _can_delete_preset(preset, user.id):
            raise_forbidden()
        await info.context.db.delete(preset)
        await info.context.db.commit()
        return True
