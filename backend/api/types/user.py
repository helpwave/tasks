from typing import TYPE_CHECKING, Annotated

import strawberry
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload

if TYPE_CHECKING:
    from api.types.location import LocationNodeType
    from api.types.task import TaskType


@strawberry.type
class UserType:
    id: strawberry.ID
    username: str
    email: str | None
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

    @strawberry.field
    async def root_locations(
        self,
        info,
    ) -> list[Annotated["LocationNodeType", strawberry.lazy("api.types.location")]]:
        result = await info.context.db.execute(
            select(models.User)
            .where(models.User.id == self.id)
            .options(selectinload(models.User.root_locations))
        )
        user = result.scalars().first()
        if not user:
            return []
        return user.root_locations or []
