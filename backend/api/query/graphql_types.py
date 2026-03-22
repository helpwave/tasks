import strawberry

from api.query.enums import (
    QueryOperator,
    QueryableFieldKind,
    QueryableValueType,
    ReferenceFilterMode,
)


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
    searchable: bool
    relation: QueryableRelationMeta | None = None
    choice: QueryableChoiceMeta | None = None
    property_definition_id: str | None = None
