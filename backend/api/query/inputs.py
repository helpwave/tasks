from datetime import date, datetime

import strawberry

from api.inputs import SortDirection
from api.query.enums import QueryOperator


@strawberry.input
class QueryFilterValueInput:
    string_value: str | None = None
    string_values: list[str] | None = None
    float_value: float | None = None
    float_min: float | None = None
    float_max: float | None = None
    int_value: int | None = None
    bool_value: bool | None = None
    date_value: date | None = None
    date_min: date | None = None
    date_max: date | None = None
    date_time_value: datetime | None = None
    uuid_value: str | None = None
    uuid_values: list[str] | None = None


@strawberry.input
class QueryFilterClauseInput:
    field_key: str
    operator: QueryOperator
    value: QueryFilterValueInput | None = None


@strawberry.input
class QuerySortClauseInput:
    field_key: str
    direction: SortDirection


@strawberry.input
class QuerySearchInput:
    search_text: str | None = None
    include_properties: bool = False
