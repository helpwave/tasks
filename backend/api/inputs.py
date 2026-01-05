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
