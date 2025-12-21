from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: AsyncSession, model: type[ModelType]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: str) -> ModelType | None:
        result = await self.db.execute(
            select(self.model).where(self.model.id == id),
        )
        return result.scalars().first()

    async def get_by_id_or_raise(
        self, id: str, error_message: str = "Entity not found"
    ) -> ModelType:
        entity = await self.get_by_id(id)
        if not entity:
            raise Exception(error_message)
        return entity

    async def get_all(self) -> list[ModelType]:
        result = await self.db.execute(select(self.model))
        return list(result.scalars().all())

    async def create(self, entity: ModelType) -> ModelType:
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def update(self, entity: ModelType) -> ModelType:
        await self.db.commit()
        await self.db.refresh(entity)
        return entity

    async def delete(self, entity: ModelType) -> None:
        await self.db.delete(entity)
        await self.db.commit()


class BaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def commit_and_refresh(self, entity) -> None:
        await self.db.commit()
        await self.db.refresh(entity)
