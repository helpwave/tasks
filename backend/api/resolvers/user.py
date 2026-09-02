import strawberry
from api.context import Info
from api.errors import raise_unauthenticated
from api.inputs import PaginationInput, UpdateProfilePictureInput
from api.query.execute import unified_list_query
from api.query.inputs import (
    QueryFilterClauseInput,
    QuerySearchInput,
    QuerySortClauseInput,
)
from api.query.registry import USER
from api.resolvers.base import BaseMutationResolver
from api.services.authorization import AuthorizationService
from api.types.user import UserType
from database import models
from graphql import GraphQLError
from sqlalchemy import or_, select


async def _visible_user_filter(info: Info):
    user = info.context.user
    if not user:
        raise_unauthenticated()
    auth_service = AuthorizationService(info.context.db)
    accessible = await auth_service.get_user_accessible_location_ids(
        user, info.context
    )
    peer_ids = select(models.user_root_locations.c.user_id).where(
        models.user_root_locations.c.location_id.in_(accessible)
        if accessible
        else models.user_root_locations.c.location_id.is_(None)
    )
    return or_(models.User.id == user.id, models.User.id.in_(peer_ids))


@strawberry.type
class UserQuery:
    @strawberry.field
    async def user(self, info: Info, id: strawberry.ID) -> UserType | None:
        result = await info.context.db.execute(
            select(models.User).where(
                models.User.id == id,
                await _visible_user_filter(info),
            ),
        )
        return result.scalars().first()

    @strawberry.field
    @unified_list_query(USER)
    async def users(
        self,
        info: Info,
        filters: list[QueryFilterClauseInput] | None = None,
        sorts: list[QuerySortClauseInput] | None = None,
        pagination: PaginationInput | None = None,
        search: QuerySearchInput | None = None,
    ) -> list[UserType]:
        query = select(models.User).where(await _visible_user_filter(info))
        return query

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
