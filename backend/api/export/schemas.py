from datetime import date, datetime
from typing import Literal

from api.inputs import PatientState, SortDirection
from api.query.enums import QueryOperator
from api.query.inputs import (
    QueryFilterClauseInput,
    QueryFilterValueInput,
    QuerySearchInput,
    QuerySortClauseInput,
)
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

ExportEntity = Literal["tasks", "patients"]
ExportFormat = Literal["csv", "xlsx"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ExportColumnInput(CamelModel):
    key: str
    label: str


class ExportFilterValueInput(CamelModel):
    string_value: str | None = None
    string_values: list[str] | None = None
    float_value: float | None = None
    float_min: float | None = None
    float_max: float | None = None
    bool_value: bool | None = None
    date_value: datetime | None = None
    date_min: date | None = None
    date_max: date | None = None
    uuid_value: str | None = None
    uuid_values: list[str] | None = None


class ExportFilterClauseInput(CamelModel):
    field_key: str
    operator: QueryOperator
    value: ExportFilterValueInput | None = None


class ExportSortClauseInput(CamelModel):
    field_key: str
    direction: SortDirection


class ExportSearchInput(CamelModel):
    search_text: str | None = None
    include_properties: bool = False


class TableExportRequest(CamelModel):
    format: ExportFormat
    columns: list[ExportColumnInput] = Field(min_length=1)
    filters: list[ExportFilterClauseInput] = Field(default_factory=list)
    sorts: list[ExportSortClauseInput] = Field(default_factory=list)
    search: ExportSearchInput | None = None
    locale: str = "de-DE"
    timezone: str = "Europe/Berlin"
    title: str | None = None
    root_location_ids: list[str] | None = None
    assignee_id: str | None = None
    assignee_team_id: str | None = None
    patient_id: str | None = None
    location_node_id: str | None = None
    states: list[PatientState] | None = None

    def query_filters(self) -> list[QueryFilterClauseInput] | None:
        if not self.filters:
            return None
        return [
            QueryFilterClauseInput(
                field_key=clause.field_key,
                operator=clause.operator,
                value=(
                    QueryFilterValueInput(
                        **clause.value.model_dump()
                    )
                    if clause.value is not None
                    else None
                ),
            )
            for clause in self.filters
        ]

    def query_sorts(self) -> list[QuerySortClauseInput] | None:
        if not self.sorts:
            return None
        return [
            QuerySortClauseInput(
                field_key=clause.field_key,
                direction=clause.direction,
            )
            for clause in self.sorts
        ]

    def query_search(self) -> QuerySearchInput | None:
        if self.search is None or not (self.search.search_text or "").strip():
            return None
        return QuerySearchInput(
            search_text=self.search.search_text,
            include_properties=self.search.include_properties,
        )
