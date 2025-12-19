from datetime import datetime
from typing import TYPE_CHECKING, Annotated

import strawberry
from api.context import Info
from api.types.property import PropertyValueType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload

if TYPE_CHECKING:
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
    patient_id: strawberry.ID

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
        from api.audit import AuditLogger

        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "done": self.done,
            "due_date": str(self.due_date) if self.due_date else None,
            "assignee_id": self.assignee_id,
            "patient_id": self.patient_id,
        }
        return AuditLogger.calculate_checksum(data)
