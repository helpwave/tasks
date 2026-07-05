from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

from api.inputs import FieldType, PatientState
from database import models

# Date-only due dates are stored as an UTC 23:59:59.999 sentinel; the wall
# clock date must be shown as-is instead of being converted to the target
# timezone (see web/utils/dueDate.ts).
_DATE_ONLY_SENTINEL_MICROSECOND = 999000

CLINIC_KINDS = ("CLINIC", "PRACTICE")

LOCATION_KIND_COLUMNS: dict[str, tuple[str, ...]] = {
    "location-CLINIC": CLINIC_KINDS,
    "location-WARD": ("WARD",),
    "location-ROOM": ("ROOM",),
    "location-BED": ("BED",),
}


@dataclass
class ExportCell:
    value: Any
    kind: str = "text"  # text | number | bool | date | datetime


@dataclass
class LocationInfo:
    title: str
    kind: str | None
    parent_id: str | None


@dataclass
class ExportContext:
    labels: dict[str, str]
    formats: dict[str, str]
    tz: ZoneInfo
    now: datetime
    locations: dict[str, LocationInfo] = field(default_factory=dict)
    users: dict[str, models.User] = field(default_factory=dict)
    property_definitions: dict[str, models.PropertyDefinition] = field(
        default_factory=dict,
    )
    properties_by_entity: dict[str, dict[str, models.PropertyValue]] = field(
        default_factory=dict,
    )


def is_date_only_due_date(value: datetime) -> bool:
    return (
        value.hour == 23
        and value.minute == 59
        and value.second == 59
        and value.microsecond >= _DATE_ONLY_SENTINEL_MICROSECOND
    )


def to_zoned(value: datetime, tz: ZoneInfo) -> datetime:
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return aware.astimezone(tz).replace(tzinfo=None)


def user_display_name(user: models.User | None) -> str | None:
    if user is None:
        return None
    if user.firstname and user.lastname:
        return f"{user.firstname} {user.lastname}"
    return user.username


def location_path_nodes(
    location_id: str | None,
    locations: dict[str, LocationInfo],
) -> list[tuple[str, LocationInfo]]:
    path: list[tuple[str, LocationInfo]] = []
    seen: set[str] = set()
    current_id = location_id
    while current_id and current_id not in seen:
        seen.add(current_id)
        node = locations.get(current_id)
        if node is None:
            break
        path.append((current_id, node))
        current_id = node.parent_id
    path.reverse()
    return path


def location_title_by_kind(
    location_id: str | None,
    kinds: tuple[str, ...],
    locations: dict[str, LocationInfo],
) -> str | None:
    for _, node in location_path_nodes(location_id, locations):
        if node.kind and node.kind.upper() in kinds:
            return node.title
    return None


def _datetime_cell(value: datetime | None, ctx: ExportContext) -> ExportCell:
    if value is None:
        return ExportCell(None)
    return ExportCell(to_zoned(value, ctx.tz), kind="datetime")


def _due_date_cell(value: datetime | None, ctx: ExportContext) -> ExportCell:
    if value is None:
        return ExportCell(None)
    if is_date_only_due_date(value):
        return ExportCell(value.date(), kind="date")
    return _datetime_cell(value, ctx)


def _property_cell(
    entity_id: str,
    definition_id: str,
    ctx: ExportContext,
) -> ExportCell:
    definition = ctx.property_definitions.get(definition_id)
    prop = ctx.properties_by_entity.get(entity_id, {}).get(definition_id)
    if definition is None or prop is None:
        return ExportCell(None)
    field_type = definition.field_type
    if field_type == FieldType.FIELD_TYPE_NUMBER.value:
        return ExportCell(prop.number_value, kind="number")
    if field_type == FieldType.FIELD_TYPE_CHECKBOX.value:
        if prop.boolean_value is None:
            return ExportCell(None)
        return ExportCell(prop.boolean_value, kind="bool")
    if field_type == FieldType.FIELD_TYPE_DATE.value:
        return ExportCell(prop.date_value, kind="date")
    if field_type == FieldType.FIELD_TYPE_DATE_TIME.value:
        return _datetime_cell(prop.date_time_value, ctx)
    if field_type == FieldType.FIELD_TYPE_SELECT.value:
        return ExportCell(prop.select_value)
    if field_type == FieldType.FIELD_TYPE_MULTI_SELECT.value:
        if not prop.multi_select_values:
            return ExportCell(None)
        return ExportCell(
            ", ".join(
                v for v in prop.multi_select_values.split(",") if v
            ),
        )
    if field_type == FieldType.FIELD_TYPE_USER.value:
        raw = prop.user_value
        if not raw:
            return ExportCell(None)
        if raw.startswith("team:"):
            team = ctx.locations.get(raw.removeprefix("team:"))
            return ExportCell(team.title if team else None)
        return ExportCell(user_display_name(ctx.users.get(raw)))
    return ExportCell(prop.text_value)


def task_cell(task: models.Task, key: str, ctx: ExportContext) -> ExportCell:
    if key.startswith("property_"):
        return _property_cell(task.id, key.removeprefix("property_"), ctx)
    if key == "done":
        return ExportCell(task.done, kind="bool")
    if key == "title":
        return ExportCell(task.title)
    if key == "description":
        return ExportCell(task.description)
    if key == "dueDate":
        return _due_date_cell(task.due_date, ctx)
    if key == "creationDate":
        return _datetime_cell(task.creation_date, ctx)
    if key == "updateDate":
        return _datetime_cell(task.update_date or task.creation_date, ctx)
    if key == "priority":
        return ExportCell(task.priority)
    if key == "estimatedTime":
        return ExportCell(task.estimated_time, kind="number")
    if key == "patient":
        if task.patient is None:
            return ExportCell(ctx.labels["no_patient"])
        return ExportCell(
            f"{task.patient.firstname} {task.patient.lastname}",
        )
    if key == "assignee":
        names = [
            name
            for name in (
                user_display_name(assignee) for assignee in task.assignees
            )
            if name
        ]
        if names:
            return ExportCell(", ".join(names))
        if task.assignee_team_id:
            team = ctx.locations.get(task.assignee_team_id)
            return ExportCell(team.title if team else None)
        return ExportCell(None)
    return ExportCell(None)


def _patient_age_years(birthdate: date, today: date) -> int:
    return (
        today.year
        - birthdate.year
        - ((today.month, today.day) < (birthdate.month, birthdate.day))
    )


def _patient_update_date(patient: models.Patient) -> datetime | None:
    task_dates = [
        task.update_date for task in patient.tasks if task.update_date
    ]
    task_max = max(task_dates) if task_dates else None
    if task_max is not None and patient.updated_at is not None:
        return max(task_max, patient.updated_at)
    return task_max or patient.updated_at


def patient_cell(
    patient: models.Patient,
    key: str,
    ctx: ExportContext,
) -> ExportCell:
    if key.startswith("property_"):
        return _property_cell(patient.id, key.removeprefix("property_"), ctx)
    if key == "name":
        return ExportCell(f"{patient.firstname} {patient.lastname}")
    if key == "firstname":
        return ExportCell(patient.firstname)
    if key == "lastname":
        return ExportCell(patient.lastname)
    if key == "state":
        return ExportCell(
            ctx.labels.get(f"state_{patient.state}", patient.state),
        )
    if key == "sex":
        return ExportCell(ctx.labels.get(f"sex_{patient.sex}", patient.sex))
    if key == "description":
        return ExportCell(patient.description)
    if key == "clinic":
        clinic = ctx.locations.get(patient.clinic_id or "")
        return ExportCell(clinic.title if clinic else None)
    if key == "position":
        position = ctx.locations.get(patient.position_id or "")
        return ExportCell(position.title if position else None)
    if key in LOCATION_KIND_COLUMNS:
        return ExportCell(
            location_title_by_kind(
                patient.position_id,
                LOCATION_KIND_COLUMNS[key],
                ctx.locations,
            ),
        )
    if key == "birthdate":
        today = ctx.now.date()
        age = _patient_age_years(patient.birthdate, today)
        formatted = patient.birthdate.strftime(ctx.formats["date"])
        return ExportCell(f"{formatted} ({age} {ctx.labels['years']})")
    if key == "tasks":
        counts_for_aggregate = patient.state in (
            PatientState.ADMITTED.value,
            PatientState.WAIT.value,
        )
        tasks = patient.tasks if counts_for_aggregate else []
        closed = sum(1 for task in tasks if task.done)
        return ExportCell(f"{closed}/{len(tasks)}")
    if key == "updateDate":
        return _datetime_cell(_patient_update_date(patient), ctx)
    return ExportCell(None)
