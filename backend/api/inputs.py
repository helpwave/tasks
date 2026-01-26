from datetime import date, datetime
from enum import Enum

import strawberry


@strawberry.enum
class Sex(Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    UNKNOWN = "UNKNOWN"


@strawberry.enum
class LocationType(Enum):
    HOSPITAL = "HOSPITAL"
    PRACTICE = "PRACTICE"
    CLINIC = "CLINIC"
    TEAM = "TEAM"
    WARD = "WARD"
    ROOM = "ROOM"
    BED = "BED"
    OTHER = "OTHER"


@strawberry.enum
class FieldType(Enum):
    FIELD_TYPE_UNSPECIFIED = "FIELD_TYPE_UNSPECIFIED"
    FIELD_TYPE_TEXT = "FIELD_TYPE_TEXT"
    FIELD_TYPE_NUMBER = "FIELD_TYPE_NUMBER"
    FIELD_TYPE_CHECKBOX = "FIELD_TYPE_CHECKBOX"
    FIELD_TYPE_DATE = "FIELD_TYPE_DATE"
    FIELD_TYPE_DATE_TIME = "FIELD_TYPE_DATE_TIME"
    FIELD_TYPE_SELECT = "FIELD_TYPE_SELECT"
    FIELD_TYPE_MULTI_SELECT = "FIELD_TYPE_MULTI_SELECT"


@strawberry.enum
class PropertyEntity(Enum):
    PATIENT = "PATIENT"
    TASK = "TASK"


@strawberry.enum
class PatientState(Enum):
    WAIT = "WAIT"
    ADMITTED = "ADMITTED"
    DISCHARGED = "DISCHARGED"
    DEAD = "DEAD"


@strawberry.enum
class TaskPriority(Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


@strawberry.input
class PropertyValueInput:
    definition_id: strawberry.ID
    text_value: str | None = None
    number_value: float | None = None
    boolean_value: bool | None = None
    date_value: date | None = None
    date_time_value: datetime | None = None
    select_value: str | None = None
    multi_select_values: list[str] | None = None


@strawberry.input
class CreatePatientInput:
    firstname: str
    lastname: str
    birthdate: date
    sex: Sex
    assigned_location_id: strawberry.ID | None = None
    assigned_location_ids: list[strawberry.ID] | None = None
    clinic_id: strawberry.ID
    position_id: strawberry.ID | None = (
        None
    )
    team_ids: list[strawberry.ID] | None = (
        None
    )
    properties: list[PropertyValueInput] | None = None
    state: PatientState | None = None
    description: str | None = None


@strawberry.input
class UpdatePatientInput:
    firstname: str | None = None
    lastname: str | None = None
    birthdate: date | None = None
    sex: Sex | None = None
    assigned_location_id: strawberry.ID | None = None
    assigned_location_ids: list[strawberry.ID] | None = None
    clinic_id: strawberry.ID | None = None
    position_id: strawberry.ID | None = strawberry.UNSET
    team_ids: list[strawberry.ID] | None = strawberry.UNSET
    properties: list[PropertyValueInput] | None = None
    checksum: str | None = None
    description: str | None = None


@strawberry.input
class CreateTaskInput:
    title: str
    patient_id: strawberry.ID
    description: str | None = None
    due_date: datetime | None = None
    assignee_id: strawberry.ID | None = None
    assignee_team_id: strawberry.ID | None = None
    previous_task_ids: list[strawberry.ID] | None = None
    properties: list[PropertyValueInput] | None = None
    priority: TaskPriority | None = None
    estimated_time: int | None = None


@strawberry.input
class UpdateTaskInput:
    title: str | None = None
    description: str | None = None
    done: bool | None = None
    due_date: datetime | None = strawberry.UNSET
    assignee_id: strawberry.ID | None = None
    assignee_team_id: strawberry.ID | None = strawberry.UNSET
    previous_task_ids: list[strawberry.ID] | None = None
    properties: list[PropertyValueInput] | None = None
    checksum: str | None = None
    priority: TaskPriority | None = strawberry.UNSET
    estimated_time: int | None = strawberry.UNSET


@strawberry.input
class CreateLocationNodeInput:
    title: str
    kind: LocationType
    parent_id: strawberry.ID | None = None


@strawberry.input
class UpdateLocationNodeInput:
    title: str | None = None
    kind: LocationType | None = None
    parent_id: strawberry.ID | None = None


@strawberry.input
class CreatePropertyDefinitionInput:
    name: str
    field_type: FieldType
    allowed_entities: list[PropertyEntity]
    description: str | None = None
    options: list[str] | None = None
    is_active: bool = True


@strawberry.input
class UpdatePropertyDefinitionInput:
    name: str | None = None
    description: str | None = None
    options: list[str] | None = None
    is_active: bool | None = None
    allowed_entities: list[PropertyEntity] | None = None


@strawberry.input
class UpdateProfilePictureInput:
    avatar_url: str


@strawberry.enum
class SortDirection(Enum):
    ASC = "ASC"
    DESC = "DESC"


@strawberry.enum
class FilterOperator(Enum):
    TEXT_EQUALS = "TEXT_EQUALS"
    TEXT_NOT_EQUALS = "TEXT_NOT_EQUALS"
    TEXT_NOT_WHITESPACE = "TEXT_NOT_WHITESPACE"
    TEXT_CONTAINS = "TEXT_CONTAINS"
    TEXT_NOT_CONTAINS = "TEXT_NOT_CONTAINS"
    TEXT_STARTS_WITH = "TEXT_STARTS_WITH"
    TEXT_ENDS_WITH = "TEXT_ENDS_WITH"
    NUMBER_EQUALS = "NUMBER_EQUALS"
    NUMBER_NOT_EQUALS = "NUMBER_NOT_EQUALS"
    NUMBER_GREATER_THAN = "NUMBER_GREATER_THAN"
    NUMBER_GREATER_THAN_OR_EQUAL = "NUMBER_GREATER_THAN_OR_EQUAL"
    NUMBER_LESS_THAN = "NUMBER_LESS_THAN"
    NUMBER_LESS_THAN_OR_EQUAL = "NUMBER_LESS_THAN_OR_EQUAL"
    NUMBER_BETWEEN = "NUMBER_BETWEEN"
    NUMBER_NOT_BETWEEN = "NUMBER_NOT_BETWEEN"
    DATE_EQUALS = "DATE_EQUALS"
    DATE_NOT_EQUALS = "DATE_NOT_EQUALS"
    DATE_GREATER_THAN = "DATE_GREATER_THAN"
    DATE_GREATER_THAN_OR_EQUAL = "DATE_GREATER_THAN_OR_EQUAL"
    DATE_LESS_THAN = "DATE_LESS_THAN"
    DATE_LESS_THAN_OR_EQUAL = "DATE_LESS_THAN_OR_EQUAL"
    DATE_BETWEEN = "DATE_BETWEEN"
    DATE_NOT_BETWEEN = "DATE_NOT_BETWEEN"
    DATETIME_EQUALS = "DATETIME_EQUALS"
    DATETIME_NOT_EQUALS = "DATETIME_NOT_EQUALS"
    DATETIME_GREATER_THAN = "DATETIME_GREATER_THAN"
    DATETIME_GREATER_THAN_OR_EQUAL = "DATETIME_GREATER_THAN_OR_EQUAL"
    DATETIME_LESS_THAN = "DATETIME_LESS_THAN"
    DATETIME_LESS_THAN_OR_EQUAL = "DATETIME_LESS_THAN_OR_EQUAL"
    DATETIME_BETWEEN = "DATETIME_BETWEEN"
    DATETIME_NOT_BETWEEN = "DATETIME_NOT_BETWEEN"
    BOOLEAN_IS_TRUE = "BOOLEAN_IS_TRUE"
    BOOLEAN_IS_FALSE = "BOOLEAN_IS_FALSE"
    TAGS_EQUALS = "TAGS_EQUALS"
    TAGS_NOT_EQUALS = "TAGS_NOT_EQUALS"
    TAGS_CONTAINS = "TAGS_CONTAINS"
    TAGS_NOT_CONTAINS = "TAGS_NOT_CONTAINS"
    TAGS_SINGLE_EQUALS = "TAGS_SINGLE_EQUALS"
    TAGS_SINGLE_NOT_EQUALS = "TAGS_SINGLE_NOT_EQUALS"
    TAGS_SINGLE_CONTAINS = "TAGS_SINGLE_CONTAINS"
    TAGS_SINGLE_NOT_CONTAINS = "TAGS_SINGLE_NOT_CONTAINS"
    IS_NULL = "IS_NULL"
    IS_NOT_NULL = "IS_NOT_NULL"


@strawberry.enum
class ColumnType(Enum):
    DIRECT_ATTRIBUTE = "DIRECT_ATTRIBUTE"
    PROPERTY = "PROPERTY"


@strawberry.input
class FilterParameter:
    search_text: str | None = None
    is_case_sensitive: bool = False
    compare_value: float | None = None
    min: float | None = None
    max: float | None = None
    compare_date: date | None = None
    min_date: date | None = None
    max_date: date | None = None
    compare_date_time: datetime | None = None
    min_date_time: datetime | None = None
    max_date_time: datetime | None = None
    search_tags: list[str] | None = None
    property_definition_id: str | None = None


@strawberry.input
class SortInput:
    column: str
    direction: SortDirection
    column_type: ColumnType = ColumnType.DIRECT_ATTRIBUTE
    property_definition_id: str | None = None


@strawberry.input
class FilterInput:
    column: str
    operator: FilterOperator
    parameter: FilterParameter
    column_type: ColumnType = ColumnType.DIRECT_ATTRIBUTE
    property_definition_id: str | None = None


@strawberry.input
class PaginationInput:
    pageIndex: int = 0
    pageSize: int | None = None


@strawberry.input
class QueryOptionsInput:
    sorting: list[SortInput] | None = None
    filtering: list[FilterInput] | None = None
    pagination: PaginationInput | None = None


@strawberry.input
class FullTextSearchInput:
    search_text: str
    search_columns: list[str] | None = None
    include_properties: bool = False
    property_definition_ids: list[str] | None = None


@strawberry.type
class PaginatedResponse:
    data: list[strawberry.scalars.JSON]
    total_count: int
