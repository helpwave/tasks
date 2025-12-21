from typing import TYPE_CHECKING, Annotated

import strawberry
from api import inputs
from api.context import Info
from database import models
from sqlalchemy import select

if TYPE_CHECKING:
    from api.types.patient import PatientType


@strawberry.type
class LocationNodeType:
    id: strawberry.ID
    title: str
    kind: inputs.LocationType
    parent_id: strawberry.ID | None

    @strawberry.field
    async def parent(
        self,
        info: Info,
    ) -> (
        Annotated[
            "LocationNodeType",
            strawberry.lazy("api.types.location"),
        ]
        | None
    ):
        if not self.parent_id:
            return None
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == self.parent_id,
            ),
        )
        return result.scalars().first()

    @strawberry.field
    async def children(
        self,
        info: Info,
    ) -> list[
        Annotated["LocationNodeType", strawberry.lazy("api.types.location")]
    ]:
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.parent_id == self.id,
            ),
        )
        return result.scalars().all()

    @strawberry.field
    async def patients(
        self,
        info: Info,
    ) -> list[Annotated["PatientType", strawberry.lazy("api.types.patient")]]:

        result = await info.context.db.execute(
            select(models.Patient).where(
                models.Patient.assigned_location_id == self.id,
            ),
        )
        return result.scalars().all()

    @strawberry.field
    async def organization_ids(self, info: Info) -> list[str]:
        result = await info.context.db.execute(
            select(models.location_organizations.c.organization_id).where(
                models.location_organizations.c.location_id == self.id,
            ),
        )
        return [row[0] for row in result.all()]
