import strawberry
from api.context import Info
from api.inputs import CreateLocationNodeInput, UpdateLocationNodeInput
from api.types.location import LocationNodeType
from database import models
from sqlalchemy import select


@strawberry.type
class LocationQuery:
    @strawberry.field
    async def location_roots(self, info: Info) -> list[LocationNodeType]:
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.parent_id == None,  # noqa: E711
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


@strawberry.type
class LocationMutation:
    @strawberry.mutation
    async def create_location_node(
        self,
        info: Info,
        data: CreateLocationNodeInput,
    ) -> LocationNodeType:
        node = models.LocationNode(
            title=data.title,
            kind=data.kind.value,
            parent_id=data.parent_id,
        )
        info.context.db.add(node)
        await info.context.db.commit()
        await info.context.db.refresh(node)
        return node

    @strawberry.mutation
    async def update_location_node(
        self,
        info: Info,
        id: strawberry.ID,
        data: UpdateLocationNodeInput,
    ) -> LocationNodeType:
        db = info.context.db
        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )
        node = result.scalars().first()
        if not node:
            raise Exception("Location not found")

        if data.title is not None:
            node.title = data.title
        if data.kind is not None:
            node.kind = data.kind.value
        if data.parent_id is not None:
            node.parent_id = data.parent_id

        await db.commit()
        await db.refresh(node)
        return node

    @strawberry.mutation
    async def delete_location_node(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        db = info.context.db
        result = await db.execute(
            select(models.LocationNode).where(models.LocationNode.id == id),
        )
        node = result.scalars().first()
        if not node:
            return False

        await db.delete(node)
        await db.commit()
        return True
