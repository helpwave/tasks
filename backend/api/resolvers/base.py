import logging
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
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
from database import models
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType")


async def update_user_last_online(db: AsyncSession, user_id: str | None) -> None:
    if not user_id:
        return
    try:
        await db.execute(
            update(models.User)
            .where(models.User.id == user_id)
            .values(last_online=datetime.now(timezone.utc))
        )
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to update last_online for user {user_id}: {e}")
        await db.rollback()


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
        if info.context.user:
            await update_user_last_online(info.context.db, info.context.user.id)
        channel = f"{entity_name}_created"
        logger.info(
            f"[SUBSCRIPTION] Initializing entity_created subscription: "
            f"entity_name={entity_name}, channel={channel}"
        )
        async for entity_id in create_redis_subscription(channel):
            logger.info(
                f"[SUBSCRIPTION] BaseSubscriptionResolver received entity_created event: "
                f"entity_name={entity_name}, entity_id={entity_id}, channel={channel}"
            )
            yield entity_id

    @staticmethod
    async def entity_updated(
        info: Info,
        entity_name: str,
        entity_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        if info.context.user:
            await update_user_last_online(info.context.db, info.context.user.id)
        channel = f"{entity_name}_updated"
        logger.info(
            f"[SUBSCRIPTION] Initializing entity_updated subscription: "
            f"entity_name={entity_name}, entity_id={entity_id}, channel={channel}"
        )
        async for updated_id in create_redis_subscription(channel, str(entity_id) if entity_id else None):
            logger.info(
                f"[SUBSCRIPTION] BaseSubscriptionResolver received entity_updated event: "
                f"entity_name={entity_name}, updated_id={updated_id}, "
                f"filter_entity_id={entity_id}, channel={channel}"
            )
            yield updated_id

    @staticmethod
    async def entity_deleted(
        info: Info, entity_name: str
    ) -> AsyncGenerator[strawberry.ID, None]:
        if info.context.user:
            await update_user_last_online(info.context.db, info.context.user.id)
        channel = f"{entity_name}_deleted"
        logger.info(
            f"[SUBSCRIPTION] Initializing entity_deleted subscription: "
            f"entity_name={entity_name}, channel={channel}"
        )
        async for entity_id in create_redis_subscription(channel):
            logger.info(
                f"[SUBSCRIPTION] BaseSubscriptionResolver received entity_deleted event: "
                f"entity_name={entity_name}, entity_id={entity_id}, channel={channel}"
            )
            yield entity_id
