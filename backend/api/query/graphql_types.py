import strawberry

from api.inputs import SortDirection
from api.query.enums import (
    QueryOperator,
    QueryableFieldKind,
    QueryableValueType,
    ReferenceFilterMode,
)


def sort_directions_for(sortable: bool) -> list[SortDirection]:
    return [SortDirection.ASC, SortDirection.DESC] if sortable else []


@strawberry.type
class QueryableRelationMeta:
    target_entity: str
    id_field_key: str
    label_field_key: str
    allowed_filter_modes: list[ReferenceFilterMode]


@strawberry.type
class QueryableChoiceMeta:
    option_keys: list[str]
    option_labels: list[str]


@strawberry.type
class QueryableField:
    key: str
    label: str
    kind: QueryableFieldKind
    value_type: QueryableValueType
    allowed_operators: list[QueryOperator]
    sortable: bool
    sort_directions: list[SortDirection]
    searchable: bool
    relation: QueryableRelationMeta | None = None
    choice: QueryableChoiceMeta | None = None
    property_definition_id: str | None = None

    @strawberry.field
    def filterable(self) -> bool:
        return len(self.allowed_operators) > 0
