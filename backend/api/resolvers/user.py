import strawberry
from api.context import Info
from api.types.user import UserType
from database import models
from sqlalchemy import select


@strawberry.type
class UserQuery:
    @strawberry.field
    async def user(self, info: Info, id: strawberry.ID) -> UserType | None:
        result = await info.context.db.execute(
            select(models.User).where(models.User.id == id),
        )
        return result.scalars().first()

    @strawberry.field
    def me(self, info: Info) -> UserType | None:
        return info.context.user
