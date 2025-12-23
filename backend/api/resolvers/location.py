import strawberry
from api.context import Info
from api.inputs import LocationType
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

        result = await db.execute(query)
        return result.scalars().all()
