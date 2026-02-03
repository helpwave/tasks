from datetime import date, datetime
from typing import TYPE_CHECKING, Annotated

import strawberry
from api.context import Info
from api.inputs import FieldType, PropertyEntity
from database import models
from sqlalchemy import select

if TYPE_CHECKING:
    from api.types.location import LocationNodeType
    from api.types.user import UserType


@strawberry.type
class PropertyDefinitionType:
    id: strawberry.ID
    name: str
    description: str | None
    field_type: FieldType
    is_active: bool

    @strawberry.field
    def options(self) -> list[str]:
        return self.options.split(",") if self.options else []

    @strawberry.field
    def allowed_entities(self) -> list[PropertyEntity]:
        if not self.allowed_entities:
            return []
        return [PropertyEntity(e) for e in self.allowed_entities.split(",")]


@strawberry.type
class PropertyValueType:
    id: strawberry.ID
    definition: PropertyDefinitionType
    text_value: str | None
    number_value: float | None
    boolean_value: bool | None
    date_value: date | None
    date_time_value: datetime | None
    select_value: str | None
    user_value: str | None

    @strawberry.field
    def multi_select_values(self) -> list[str] | None:
        return (
            self.multi_select_values.split(",")
            if self.multi_select_values
            else None
        )

    @strawberry.field
    async def user(
        self,
        info: Info,
    ) -> Annotated["UserType", strawberry.lazy("api.types.user")] | None:
        if not self.user_value or self.user_value.startswith("team:"):
            return None
        result = await info.context.db.execute(
            select(models.User).where(models.User.id == self.user_value),
        )
        return result.scalars().first()

    @strawberry.field
    async def team(
        self,
        info: Info,
    ) -> Annotated["LocationNodeType", strawberry.lazy("api.types.location")] | None:
        if not self.user_value or not self.user_value.startswith("team:"):
            return None
        team_id = self.user_value[5:]
        result = await info.context.db.execute(
            select(models.LocationNode).where(models.LocationNode.id == team_id),
        )
        return result.scalars().first()
