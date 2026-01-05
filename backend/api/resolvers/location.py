from collections.abc import AsyncGenerator

import strawberry
from api.audit import audit_log
from api.context import Info
from api.decorators.pagination import apply_pagination
from api.inputs import CreateLocationNodeInput, LocationType, UpdateLocationNodeInput
from api.resolvers.base import BaseMutationResolver, BaseSubscriptionResolver
from api.services.authorization import AuthorizationService
from api.types.location import LocationNodeType
from database import models
from graphql import GraphQLError
from sqlalchemy import select


@strawberry.type
class LocationQuery:
    @strawberry.field
    async def location_roots(self, info: Info) -> list[LocationNodeType]:
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            return []

        result = await info.context.db.execute(
            select(models.LocationNode)
            .where(
                models.LocationNode.parent_id.is_(None),
                models.LocationNode.id.in_(accessible_location_ids),
            )
            .distinct()
        )
        return result.scalars().all()

    @strawberry.field
    async def location_node(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> LocationNodeType | None:
        result = await info.context.db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )
        location = result.scalars().first()

        if location:
            auth_service = AuthorizationService(info.context.db)
            accessible_location_ids = await auth_service.get_user_accessible_location_ids(
                info.context.user, info.context
            )
            if location.id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

        return location

    @strawberry.field
    async def location_nodes(
        self,
        info: Info,
        kind: LocationType | None = None,
        search: str | None = None,
        parent_id: strawberry.ID | None = None,
        recursive: bool = False,
        order_by_name: bool = False,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[LocationNodeType]:
        db = info.context.db

        auth_service = AuthorizationService(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            return []

        if recursive and parent_id:
            if parent_id not in accessible_location_ids:
                raise GraphQLError(
                    "Insufficient permission. Please contact an administrator if you believe this is an error.",
                    extensions={"code": "FORBIDDEN"},
                )

            cte = (
                select(models.LocationNode)
                .where(models.LocationNode.id == parent_id)
                .cte(name="location_tree", recursive=True)
            )

            parent = select(models.LocationNode).join(
                cte,
                models.LocationNode.parent_id == cte.c.id,
            )
            cte = cte.union_all(parent)
            query = select(cte).where(cte.c.id.in_(accessible_location_ids))
        else:
            query = select(models.LocationNode).where(
                models.LocationNode.id.in_(accessible_location_ids)
            )
            if parent_id:
                if parent_id not in accessible_location_ids:
                    raise GraphQLError(
                        "Insufficient permission. Please contact an administrator if you believe this is an error.",
                        extensions={"code": "FORBIDDEN"},
                    )
                query = query.where(models.LocationNode.parent_id == parent_id)

        if kind:
            query = query.where(models.LocationNode.kind == kind.value)

        if search:
            query = query.where(models.LocationNode.title.ilike(f"%{search}%"))

        if order_by_name:
            query = query.order_by(models.LocationNode.title)

        query = apply_pagination(query, limit=limit, offset=offset)

        result = await db.execute(query)
        return result.scalars().all()


@strawberry.type
class LocationMutation(BaseMutationResolver[models.LocationNode]):
    @strawberry.mutation
    @audit_log("create_location_node")
    async def create_location_node(
        self,
        info: Info,
        data: CreateLocationNodeInput,
    ) -> LocationNodeType:
        db = info.context.db
        auth_service = AuthorizationService(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        if data.parent_id and data.parent_id not in accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        location = models.LocationNode(
            title=data.title,
            kind=data.kind.value,
            parent_id=data.parent_id,
        )

        location = await BaseMutationResolver.create_and_notify(
            info, location, models.LocationNode, "location_node"
        )
        return location

    @strawberry.mutation
    @audit_log("update_location_node")
    async def update_location_node(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateLocationNodeInput,
    ) -> LocationNodeType:
        db = info.context.db
        auth_service = AuthorizationService(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id)
        )
        location = result.scalars().first()

        if not location:
            raise GraphQLError(
                "Location not found.",
                extensions={"code": "NOT_FOUND"},
            )

        if location.id not in accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        if data.parent_id is not None and data.parent_id not in accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        if data.title is not None:
            location.title = data.title
        if data.kind is not None:
            location.kind = data.kind.value
        if data.parent_id is not None:
            location.parent_id = data.parent_id

        location = await BaseMutationResolver.update_and_notify(
            info, location, models.LocationNode, "location_node"
        )
        return location

    @strawberry.mutation
    @audit_log("delete_location_node")
    async def delete_location_node(self, info: Info, id: strawberry.ID) -> bool:
        db = info.context.db
        auth_service = AuthorizationService(db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )

        if not accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id)
        )
        location = result.scalars().first()

        if not location:
            raise GraphQLError(
                "Location not found.",
                extensions={"code": "NOT_FOUND"},
            )

        if location.id not in accessible_location_ids:
            raise GraphQLError(
                "Insufficient permission. Please contact an administrator if you believe this is an error.",
                extensions={"code": "FORBIDDEN"},
            )

        await BaseMutationResolver.delete_entity(
            info, location, models.LocationNode, "location_node"
        )
        return True


@strawberry.type
class LocationSubscription(BaseSubscriptionResolver):
    @strawberry.subscription
    async def location_node_created(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for location_id in BaseSubscriptionResolver.entity_created(info, "location_node"):
            yield location_id

    @strawberry.subscription
    async def location_node_updated(
        self,
        info: Info,
        location_id: strawberry.ID | None = None,
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for updated_id in BaseSubscriptionResolver.entity_updated(info, "location_node", location_id):
            yield updated_id

    @strawberry.subscription
    async def location_node_deleted(
        self, info: Info
    ) -> AsyncGenerator[strawberry.ID, None]:
        async for location_id in BaseSubscriptionResolver.entity_deleted(info, "location_node"):
            yield location_id
