from typing import TYPE_CHECKING, Annotated

import strawberry
from database import models
from sqlalchemy import select

if TYPE_CHECKING:
    from api.types.task import TaskType


@strawberry.type
class UserType:
    id: strawberry.ID
    username: str
    firstname: str | None
    lastname: str | None
    title: str | None
    avatar_url: str | None

    @strawberry.field
    def name(self) -> str:
        if self.firstname and self.lastname:
            return f"{self.firstname} {self.lastname}"
        return self.username

    @strawberry.field
    async def tasks(
        self,
        info,
    ) -> list[Annotated["TaskType", strawberry.lazy("api.types.task")]]:

        result = await info.context.db.execute(
            select(models.Task).where(models.Task.assignee_id == self.id),
        )
        return result.scalars().all()
