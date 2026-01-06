import strawberry
from api.context import Info
from api.inputs import UpdateProfilePictureInput
from api.resolvers.base import BaseMutationResolver
from api.types.user import UserType
from database import models
from graphql import GraphQLError
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
    async def users(self, info: Info) -> list[UserType]:
        result = await info.context.db.execute(select(models.User))
        return result.scalars().all()

    @strawberry.field
    def me(self, info: Info) -> UserType | None:
        return info.context.user


@strawberry.type
class UserMutation(BaseMutationResolver[models.User]):
    @strawberry.mutation
    async def update_profile_picture(
        self,
        info: Info,
        data: UpdateProfilePictureInput,
    ) -> UserType:
        if not info.context.user:
            raise GraphQLError(
                "Authentication required. Please log in to update your profile picture.",
                extensions={"code": "UNAUTHENTICATED"},
            )

        user = info.context.user
        user.avatar_url = data.avatar_url

        await BaseMutationResolver.update_and_notify(
            info,
            user,
            models.User,
            "user",
        )

        return user
