import strawberry
from api.context import Info
from api.inputs import LocationType
from api.types.location import LocationNodeType
from database import models
from sqlalchemy import select


@strawberry.type
class LocationQuery:
    @strawberry.field
    async def location_roots(self, info: Info) -> list[LocationNodeType]:
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.parent_id == None,
            ),
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
        return result.scalars().first()

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

        if recursive and parent_id:
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
            query = select(cte)
        else:
            query = select(models.LocationNode)
            if parent_id:
                query = query.where(models.LocationNode.parent_id == parent_id)

        if kind:
            query = query.where(models.LocationNode.kind == kind.value)

        if search:
            query = query.where(models.LocationNode.title.ilike(f"%{search}%"))

        if order_by_name:
            query = query.order_by(models.LocationNode.title)

        result = await db.execute(query)
        return result.scalars().all()
