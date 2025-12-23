from typing import TYPE_CHECKING, Annotated

import strawberry
from database import models
from sqlalchemy import select
from sqlalchemy.orm import aliased, selectinload

if TYPE_CHECKING:
    from api.types.location import LocationNodeType
    from api.types.task import TaskType


@strawberry.type
class UserType:
    id: strawberry.ID
    username: str
    email: str | None
    firstname: str | None
    lastname: str | None
    title: str | None
    avatar_url: str | None

    @strawberry.field
    def name(self) -> str:
        if self.firstname and self.lastname:
            return f"{self.firstname} {self.lastname}"
        return self.username

    @strawberry.field
    async def tasks(
        self,
        info,
    ) -> list[Annotated["TaskType", strawberry.lazy("api.types.task")]]:
        from api.services.authorization import AuthorizationService
        
        auth_service = AuthorizationService(info.context.db)
        accessible_location_ids = await auth_service.get_user_accessible_location_ids(
            info.context.user, info.context
        )
        
        if not accessible_location_ids:
            return []
        
        from sqlalchemy.orm import aliased
        patient_locations = aliased(models.patient_locations)
        patient_teams = aliased(models.patient_teams)
        
        from sqlalchemy import select
        cte = (
            select(models.LocationNode.id)
            .where(models.LocationNode.id.in_(accessible_location_ids))
            .cte(name="accessible_locations", recursive=True)
        )
        
        children = select(models.LocationNode.id).join(
            cte, models.LocationNode.parent_id == cte.c.id
        )
        cte = cte.union_all(children)
        
        query = (
            select(models.Task)
            .join(models.Patient, models.Task.patient_id == models.Patient.id)
            .outerjoin(
                patient_locations,
                models.Patient.id == patient_locations.c.patient_id,
            )
            .outerjoin(
                patient_teams,
                models.Patient.id == patient_teams.c.patient_id,
            )
            .where(
                models.Task.assignee_id == self.id,
                (
                    (models.Patient.clinic_id.in_(select(cte.c.id)))
                    | (
                        models.Patient.position_id.isnot(None)
                        & models.Patient.position_id.in_(select(cte.c.id))
                    )
                    | (
                        models.Patient.assigned_location_id.isnot(None)
                        & models.Patient.assigned_location_id.in_(select(cte.c.id))
                    )
                    | (patient_locations.c.location_id.in_(select(cte.c.id)))
                    | (patient_teams.c.location_id.in_(select(cte.c.id)))
                )
            )
            .distinct()
        )
        
        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def root_locations(
        self,
        info,
    ) -> list[Annotated["LocationNodeType", strawberry.lazy("api.types.location")]]:
        result = await info.context.db.execute(
            select(models.LocationNode)
            .join(
                models.user_root_locations,
                models.LocationNode.id == models.user_root_locations.c.location_id,
            )
            .where(models.user_root_locations.c.user_id == self.id)
            .where(models.LocationNode.parent_id.is_(None))
            .distinct()
        )
        return result.scalars().all()
