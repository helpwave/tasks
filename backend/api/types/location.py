from typing import TYPE_CHECKING, Annotated

import strawberry
from api import inputs
from api.context import Info
from api.services.authorization import AuthorizationService
from database import models
from sqlalchemy import select

if TYPE_CHECKING:
    from api.types.patient import PatientType


async def _accessible_ids(info: Info) -> set[str]:
    auth_service = AuthorizationService(info.context.db)
    return await auth_service.get_user_accessible_location_ids(
        info.context.user, info.context
    )


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
        # Never let the tree be walked upward out of the caller's scope.
        accessible = await _accessible_ids(info)
        if str(self.parent_id) not in accessible:
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
        accessible = await _accessible_ids(info)
        if not accessible:
            return []
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.parent_id == self.id,
                models.LocationNode.id.in_(accessible),
            ),
        )
        return result.scalars().all()

    @strawberry.field
    async def patients(
        self,
        info: Info,
    ) -> list[Annotated["PatientType", strawberry.lazy("api.types.patient")]]:
        # Only surface patients the caller is authorized to see, and only from
        # a location within their scope.
        accessible = await _accessible_ids(info)
        if str(self.id) not in accessible:
            return []
        auth_service = AuthorizationService(info.context.db)
        query = select(models.Patient).where(
            models.Patient.assigned_location_id == self.id,
            models.Patient.deleted.is_(False),
        )
        query = auth_service.filter_patients_by_access(
            info.context.user, query, accessible
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def organization_ids(self, info: Info) -> list[str]:
        result = await info.context.db.execute(
            select(models.location_organizations.c.organization_id).where(
                models.location_organizations.c.location_id == self.id,
            ),
        )
        return [row[0] for row in result.all()]
