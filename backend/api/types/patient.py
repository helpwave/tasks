from datetime import date

import strawberry
from api.context import Info
from api.inputs import Gender
from api.types.location import LocationNodeType
from api.types.property import PropertyValueType
from api.types.task import TaskType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload


@strawberry.type
class PatientType:
    id: strawberry.ID
    firstname: str
    lastname: str
    birthdate: date
    gender: Gender
    assigned_location_id: strawberry.ID | None

    @strawberry.field
    def name(self) -> str:
        return f"{self.firstname} {self.lastname}"

    @strawberry.field
    def age(self) -> int:
        today = date.today()
        return (
            today.year
            - self.birthdate.year
            - (
                (today.month, today.day)
                < (self.birthdate.month, self.birthdate.day)
            )
        )

    @strawberry.field
    async def assigned_location(self, info: Info) -> LocationNodeType | None:
        if not self.assigned_location_id:
            return None
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == self.assigned_location_id,
            ),
        )
        return result.scalars().first()

    @strawberry.field
    async def tasks(
        self,
        info: Info,
        done: bool | None = None,
    ) -> list[TaskType]:
        query = select(models.Task).where(models.Task.patient_id == self.id)
        if done is not None:
            query = query.where(models.Task.done == done)
        result = await info.context.db.execute(query)
        return result.scalars().all()

    @strawberry.field
    async def properties(self, info: Info) -> list[PropertyValueType]:
        query = (
            select(models.PropertyValue)
            .where(models.PropertyValue.patient_id == self.id)
            .options(selectinload(models.PropertyValue.definition))
        )
        result = await info.context.db.execute(query)
        return result.scalars().all()
