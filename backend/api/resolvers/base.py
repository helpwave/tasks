from collections.abc import AsyncGenerator
from typing import Generic, TypeVar

import strawberry
from api.context import Info
from api.services.base import BaseRepository
from api.services.notifications import notify_entity_created, notify_entity_deleted, notify_entity_update
from api.services.subscription import create_redis_subscription
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseQueryResolver(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    def get_repository(self, db: AsyncSession) -> BaseRepository[ModelType]:
        return BaseRepository(db, self.model)

    async def _get_by_id_impl(self, info: Info, id: strawberry.ID) -> ModelType | None:
        repo = self.get_repository(info.context.db)
        return await repo.get_by_id(id)

    async def _get_all_impl(self, info: Info) -> list[ModelType]:
        repo = self.get_repository(info.context.db)
        return await repo.get_all()

    @strawberry.field
    async def get_by_id(self, info: Info, id: strawberry.ID) -> ModelType | None:
        return await self._get_by_id_impl(info, id)

    @strawberry.field
    async def get_all(self, info: Info) -> list[ModelType]:
        return await self._get_all_impl(info)


class BaseMutationResolver(Generic[ModelType]):
    def __init__(self, model: type[ModelType], entity_name: str):
        self.model = model
        self.entity_name = entity_name

    def get_repository(self, db: AsyncSession) -> BaseRepository[ModelType]:
        return BaseRepository(db, self.model)

    async def delete_entity(
        self,
        info: Info,
        entity: ModelType,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> None:
        repo = self.get_repository(info.context.db)
        entity_id = entity.id
        await repo.delete(entity)
        await notify_entity_deleted(self.entity_name, entity_id, related_entity_type, related_entity_id)

    async def create_and_notify(
        self,
        info: Info,
        entity: ModelType,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> ModelType:
        repo = self.get_repository(info.context.db)
        await repo.create(entity)
        await notify_entity_created(self.entity_name, entity.id)
        if related_entity_type and related_entity_id:
            await notify_entity_update(related_entity_type, related_entity_id)
        return entity

    async def update_and_notify(
        self,
        info: Info,
        entity: ModelType,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> ModelType:
        repo = self.get_repository(info.context.db)
        await repo.update(entity)
        await notify_entity_update(self.entity_name, entity.id, related_entity_type, related_entity_id)
        return entity


class BaseSubscriptionResolver:
    def __init__(self, entity_name: str):
        self.entity_name = entity_name

    @strawberry.subscription
    async def entity_created(self, info: Info) -> AsyncGenerator[strawberry.ID, None]:
        async for entity_id in create_redis_subscription(f"{self.entity_name}_created"):
            yield entity_id

    @strawberry.subscription
    async def entity_updated(
        self,
        info: Info,
        entity_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in create_redis_subscription(f"{self.entity_name}_updated", entity_id):
            yield updated_id

    @strawberry.subscription
    async def entity_deleted(self, info: Info) -> AsyncGenerator[strawberry.ID, None]:
        async for entity_id in create_redis_subscription(f"{self.entity_name}_deleted"):
            yield entity_id
