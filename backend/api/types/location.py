import strawberry
from api import inputs
from api.context import Info
from database.models.location import LocationNode
from sqlalchemy import select


@strawberry.type
class LocationNodeType:
    id: strawberry.ID
    title: str
    kind: inputs.LocationType
    parent_id: strawberry.ID | None

    @strawberry.field
    async def parent(self, info: Info) -> "LocationNodeType | None":
        if not self.parent_id:
            return None
        result = await info.context.db.execute(
            select(LocationNode).where(LocationNode.id == self.parent_id),
        )
        return result.scalars().first()

    @strawberry.field
    async def children(self, info: Info) -> list["LocationNodeType"]:
        result = await info.context.db.execute(
            select(LocationNode).where(LocationNode.parent_id == self.id),
        )
        return result.scalars().all()
