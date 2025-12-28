from datetime import datetime
from typing import TYPE_CHECKING, Annotated

import strawberry
from api.context import Info
from api.types.base import calculate_checksum_for_instance
from api.types.property import PropertyValueType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload

if TYPE_CHECKING:
    from api.types.location import LocationNodeType
    from api.types.patient import PatientType
    from api.types.user import UserType


@strawberry.type
class TaskType:
    id: strawberry.ID
    title: str
    description: str | None
    done: bool
    due_date: datetime | None
    creation_date: datetime
    update_date: datetime | None
    assignee_id: strawberry.ID | None
    assignee_team_id: strawberry.ID | None
    patient_id: strawberry.ID
    priority: str | None
    estimated_time: int | None

    @strawberry.field
    async def assignee(
        self,
        info: Info,
    ) -> Annotated["UserType", strawberry.lazy("api.types.user")] | None:

        if not self.assignee_id:
            return None
        result = await info.context.db.execute(
            select(models.User).where(models.User.id == self.assignee_id),
        )
        return result.scalars().first()

    @strawberry.field
    async def assignee_team(
        self,
        info: Info,
    ) -> Annotated["LocationNodeType", strawberry.lazy("api.types.location")] | None:
        if not self.assignee_team_id:
            return None
        result = await info.context.db.execute(
            select(models.LocationNode).where(models.LocationNode.id == self.assignee_team_id),
        )
        return result.scalars().first()

    @strawberry.field
    async def patient(
        self,
        info: Info,
    ) -> Annotated["PatientType", strawberry.lazy("api.types.patient")]:

        result = await info.context.db.execute(
            select(models.Patient).where(models.Patient.id == self.patient_id),
        )
        return result.scalars().first()

    @strawberry.field
    async def properties(self, info: Info) -> list[PropertyValueType]:
        query = (
            select(models.PropertyValue)
            .where(models.PropertyValue.task_id == self.id)
            .options(selectinload(models.PropertyValue.definition))
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    def checksum(self) -> str:
        return calculate_checksum_for_instance(self)

    @property
    def _checksum_exclude(self) -> set[str]:
        return {"creation_date", "update_date"}
