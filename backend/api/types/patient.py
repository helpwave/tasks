from datetime import date
from typing import TYPE_CHECKING, Annotated

import strawberry
from api.context import Info
from api.inputs import PatientState, Sex
from api.types.base import calculate_checksum_for_instance
from api.types.property import PropertyValueType
from database import models
from sqlalchemy import select
from sqlalchemy.orm import selectinload

if TYPE_CHECKING:
    from api.types.location import LocationNodeType
    from api.types.task import TaskType


@strawberry.type
class PatientType:
    id: strawberry.ID
    firstname: str
    lastname: str
    birthdate: date
    sex: Sex
    state: PatientState
    assigned_location_id: strawberry.ID | None
    clinic_id: strawberry.ID
    position_id: strawberry.ID | None
    description: str | None

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
    async def assigned_location(
        self,
        info: Info,
    ) -> (
        Annotated[
            "LocationNodeType",
            strawberry.lazy("api.types.location"),
        ]
        | None
    ):
        if self.assigned_location_id:
            result = await info.context.db.execute(
                select(models.LocationNode).where(
                    models.LocationNode.id == self.assigned_location_id,
                ),
            )
            return result.scalars().first()

        query = (
            select(models.LocationNode)
            .join(models.patient_locations)
            .where(models.patient_locations.c.patient_id == self.id)
            .limit(1)
        )
        result = await info.context.db.execute(query)
        return result.scalars().first()

    @strawberry.field
    async def assigned_locations(
        self,
        info: Info,
    ) -> list[
        Annotated[
            "LocationNodeType",
            strawberry.lazy("api.types.location"),
        ]
    ]:
        await info.context.db.refresh(self, ["assigned_locations"])
        return self.assigned_locations or []

    @strawberry.field
    async def clinic(
        self,
        info: Info,
    ) -> Annotated[
        "LocationNodeType",
        strawberry.lazy("api.types.location"),
    ]:
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == self.clinic_id,
            ),
        )
        clinic = result.scalars().first()
        if not clinic:
            raise Exception(f"Clinic location not found for patient {self.id}")
        return clinic

    @strawberry.field
    async def position(
        self,
        info: Info,
    ) -> (
        Annotated[
            "LocationNodeType",
            strawberry.lazy("api.types.location"),
        ]
        | None
    ):
        if not self.position_id:
            return None
        result = await info.context.db.execute(
            select(models.LocationNode).where(
                models.LocationNode.id == self.position_id,
            ),
        )
        return result.scalars().first()

    @strawberry.field
    async def teams(
        self,
        info: Info,
    ) -> list[
        Annotated[
            "LocationNodeType",
            strawberry.lazy("api.types.location"),
        ]
    ]:
        await info.context.db.refresh(self, ["teams"])
        return self.teams or []

    @strawberry.field
    async def tasks(
        self,
        info: Info,
        done: bool | None = None,
    ) -> list[Annotated["TaskType", strawberry.lazy("api.types.task")]]:

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

    @strawberry.field
    def checksum(self) -> str:
        return calculate_checksum_for_instance(self)
