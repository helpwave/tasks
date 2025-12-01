from typing import TYPE_CHECKING, Any

import strawberry
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import BaseContext

if TYPE_CHECKING:
    from database.models.user import User


class Context(BaseContext):
    def __init__(self, db: AsyncSession, user: "User | None" = None):
        super().__init__()
        self.db = db
        self.user = user


async def get_context(db: AsyncSession) -> Context:
    return Context(db=db)


Info = strawberry.Info[Context, Any]
