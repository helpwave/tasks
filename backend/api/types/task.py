from datetime import datetime

import strawberry
from api.context import Info
from api.types.property import PropertyValueType
from api.types.user import UserType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload


@strawberry.type
class TaskType:
    id: strawberry.ID
    title: str
    description: str | None
    done: bool
    creation_date: datetime
    update_date: datetime | None
    assignee_id: strawberry.ID | None

    @strawberry.field
    async def assignee(self, info: Info) -> UserType | None:
        if not self.assignee_id:
            return None
        result = await info.context.db.execute(
            select(models.User).where(models.User.id == self.assignee_id),
        )
        return result.scalars().first()

    @strawberry.field
    async def properties(self, info: Info) -> list[PropertyValueType]:
        query = (
            select(models.PropertyValue)
            .where(models.PropertyValue.task_id == self.id)
            .options(selectinload(models.PropertyValue.definition))
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()
