import re
import uuid

import strawberry
from api.context import Info
from api.errors import raise_forbidden
from api.inputs import CreateTaskPresetInput, UpdateTaskPresetInput
from api.services.task_graph import (
    graph_dict_from_preset_inputs,
    validate_task_graph_dict,
)
from api.types.task_preset import TaskPresetType, task_preset_type_from_model
from database import models
from database.models.task_preset import TaskPresetScope as DbTaskPresetScope
from graphql import GraphQLError
from sqlalchemy import and_, or_, select


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
    if preset.scope == DbTaskPresetScope.PERSONAL.value:
        return preset.owner_user_id == user_id
    return True


def _can_delete_preset(
    preset: models.TaskPreset,
    user_id: str,
) -> bool:
    if preset.scope == DbTaskPresetScope.PERSONAL.value:
        return preset.owner_user_id == user_id
    return True


@strawberry.type
class TaskPresetQuery:
    @strawberry.field
    async def task_presets(self, info: Info) -> list[TaskPresetType]:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
        q = (
            select(models.TaskPreset)
            .where(
                or_(
                    models.TaskPreset.scope == DbTaskPresetScope.GLOBAL.value,
                    and_(
                        models.TaskPreset.scope == DbTaskPresetScope.PERSONAL.value,
                        models.TaskPreset.owner_user_id == user.id,
                    ),
                ),
            )
            .order_by(models.TaskPreset.name)
        )
        r = await info.context.db.execute(q)
        rows = r.scalars().all()
        return [task_preset_type_from_model(p) for p in rows]

    @strawberry.field
    async def task_preset(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> TaskPresetType | None:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
        r = await info.context.db.execute(
            select(models.TaskPreset).where(models.TaskPreset.id == id),
        )
        preset = r.scalars().first()
        if not preset:
            return None
        if preset.scope == DbTaskPresetScope.PERSONAL.value and preset.owner_user_id != user.id:
            raise_forbidden()
        return task_preset_type_from_model(preset)

    @strawberry.field
    async def task_preset_by_key(
        self,
        info: Info,
        key: str,
    ) -> TaskPresetType | None:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
        r = await info.context.db.execute(
            select(models.TaskPreset).where(models.TaskPreset.key == key),
        )
        preset = r.scalars().first()
        if not preset:
            return None
        if preset.scope == DbTaskPresetScope.PERSONAL.value and preset.owner_user_id != user.id:
            raise_forbidden()
        return task_preset_type_from_model(preset)


@strawberry.type
class TaskPresetMutation:
    @strawberry.mutation
    async def create_task_preset(
        self,
        info: Info,
        data: CreateTaskPresetInput,
    ) -> TaskPresetType:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
        graph_dict = graph_dict_from_preset_inputs(data.graph.nodes, data.graph.edges)
        validate_task_graph_dict(graph_dict)
        scope_val = data.scope.value
        if scope_val == DbTaskPresetScope.PERSONAL.value:
            owner_id = user.id
        else:
            owner_id = None
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
            scope=scope_val,
            owner_user_id=owner_id,
            graph_json=graph_dict,
        )
        info.context.db.add(preset)
        await info.context.db.commit()
        await info.context.db.refresh(preset)
        return task_preset_type_from_model(preset)

    @strawberry.mutation
    async def update_task_preset(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateTaskPresetInput,
    ) -> TaskPresetType:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
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
        await info.context.db.commit()
        await info.context.db.refresh(preset)
        return task_preset_type_from_model(preset)

    @strawberry.mutation
    async def delete_task_preset(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = info.context.user
        if not user:
            raise GraphQLError(
                "Not authenticated",
                extensions={"code": "UNAUTHENTICATED"},
            )
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
