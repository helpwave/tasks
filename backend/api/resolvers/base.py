from collections.abc import AsyncGenerator
from typing import Generic, TypeVar

import strawberry
from api.context import Info
from api.services.base import BaseRepository
from api.services.notifications import (
    notify_entity_created,
    notify_entity_deleted,
    notify_entity_update,
)
from api.services.subscription import create_redis_subscription
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseQueryResolver(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    def get_repository(self, db: AsyncSession) -> BaseRepository[ModelType]:
        return BaseRepository(db, self.model)

    async def _get_by_id_impl(
        self, info: Info, id: strawberry.ID
    ) -> ModelType | None:
        repo = self.get_repository(info.context.db)
        return await repo.get_by_id(id)

    async def _get_all_impl(self, info: Info) -> list[ModelType]:
        repo = self.get_repository(info.context.db)
        return await repo.get_all()

    @strawberry.field
    async def get_by_id(
        self, info: Info, id: strawberry.ID
    ) -> ModelType | None:
        return await self._get_by_id_impl(info, id)

    @strawberry.field
    async def get_all(self, info: Info) -> list[ModelType]:
        return await self._get_all_impl(info)


class BaseMutationResolver(Generic[ModelType]):
    @staticmethod
    def get_repository(db: AsyncSession, model: type[ModelType]) -> BaseRepository[ModelType]:
        return BaseRepository(db, model)

    @staticmethod
    async def delete_entity(
        info: Info,
        entity: ModelType,
        model: type[ModelType],
        entity_name: str,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> None:
        repo = BaseRepository(info.context.db, model)
        entity_id = entity.id
        await repo.delete(entity)
        await notify_entity_deleted(
            entity_name, entity_id, related_entity_type, related_entity_id
        )

    @staticmethod
    async def create_and_notify(
        info: Info,
        entity: ModelType,
        model: type[ModelType],
        entity_name: str,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> ModelType:
        repo = BaseRepository(info.context.db, model)
        await repo.create(entity)
        await notify_entity_created(entity_name, entity.id)
        if related_entity_type and related_entity_id:
            await notify_entity_update(related_entity_type, related_entity_id)
        return entity

    @staticmethod
    async def update_and_notify(
        info: Info,
        entity: ModelType,
        model: type[ModelType],
        entity_name: str,
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> ModelType:
        repo = BaseRepository(info.context.db, model)
        await repo.update(entity)
        await notify_entity_update(
            entity_name, entity.id, related_entity_type, related_entity_id
        )
        return entity


class BaseSubscriptionResolver:
    @staticmethod
    async def entity_created(
        info: Info, entity_name: str
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for entity_id in create_redis_subscription(
            f"{entity_name}_created"
        ):
            yield entity_id

    @staticmethod
    async def entity_updated(
        info: Info,
        entity_name: str,
        entity_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in create_redis_subscription(
            f"{entity_name}_updated", entity_id
        ):
            yield updated_id

    @staticmethod
    async def entity_deleted(
        info: Info, entity_name: str
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for entity_id in create_redis_subscription(
            f"{entity_name}_deleted"
        ):
            yield entity_id
