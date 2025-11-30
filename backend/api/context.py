from typing import Any

import strawberry
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import BaseContext


class Context(BaseContext):
    def __init__(self, db: AsyncSession):
        super().__init__()
        self.db = db


async def get_context(db: AsyncSession) -> Context:
    return Context(db=db)


Info = strawberry.Info[Context, Any]
