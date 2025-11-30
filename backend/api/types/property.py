from datetime import date, datetime

import strawberry
from api.inputs import FieldType, PropertyEntity


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
    definition: PropertyDefinitionType
    text_value: str | None
    number_value: float | None
    boolean_value: bool | None
    date_value: date | None
    date_time_value: datetime | None
    select_value: str | None

    @strawberry.field
    def multi_select_values(self) -> list[str] | None:
        return (
            self.multi_select_values.split(",")
            if self.multi_select_values
            else None
        )
