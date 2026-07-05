import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select

from api.context import Context
from api.export.cells import (
    ExportCell,
    ExportContext,
    LocationInfo,
    patient_cell,
    task_cell,
)
from api.export.labels import get_formats, get_labels
from api.export.render import render_csv, render_xlsx
from api.export.schemas import TableExportRequest
from api.inputs import PaginationInput
from config import EXPORT_MAX_ROWS
from database import models

_TRANSLITERATIONS = str.maketrans(
    {"ä": "ae", "ö": "oe", "ü": "ue", "Ä": "Ae", "Ö": "Oe", "Ü": "Ue", "ß": "ss"}
)

CSV_MEDIA_TYPE = "text/csv; charset=utf-8"
XLSX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


@dataclass
class ExportResult:
    content: bytes
    media_type: str
    filename: str


def _resolve_timezone(name: str) -> ZoneInfo:
    for candidate in (name, "Europe/Berlin", "UTC"):
        try:
            return ZoneInfo(candidate)
        except (ZoneInfoNotFoundError, ValueError):
            continue
    raise RuntimeError("No usable timezone database available")


def _slugify_filename(title: str) -> str:
    transliterated = title.translate(_TRANSLITERATIONS)
    normalized = unicodedata.normalize("NFKD", transliterated)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", ascii_text).strip("-._")
    return slug.lower() or "export"


async def _load_locations(db) -> dict[str, LocationInfo]:
    result = await db.execute(
        select(
            models.LocationNode.id,
            models.LocationNode.title,
            models.LocationNode.kind,
            models.LocationNode.parent_id,
        ),
    )
    return {
        row.id: LocationInfo(
            title=row.title,
            kind=row.kind,
            parent_id=row.parent_id,
        )
        for row in result.all()
    }


async def _load_property_data(
    db,
    ctx: ExportContext,
    entity_column,
    entity_ids: list[str],
) -> None:
    definitions_result = await db.execute(select(models.PropertyDefinition))
    ctx.property_definitions = {
        definition.id: definition
        for definition in definitions_result.scalars().all()
    }

    if not entity_ids:
        return

    values_result = await db.execute(
        select(models.PropertyValue).where(entity_column.in_(entity_ids)),
    )
    property_user_ids: set[str] = set()
    for value in values_result.scalars().all():
        entity_id = value.task_id or value.patient_id
        if entity_id is None:
            continue
        ctx.properties_by_entity.setdefault(entity_id, {})[
            value.definition_id
        ] = value
        if value.user_value and not value.user_value.startswith("team:"):
            property_user_ids.add(value.user_value)

    if property_user_ids:
        users_result = await db.execute(
            select(models.User).where(models.User.id.in_(property_user_ids)),
        )
        ctx.users = {user.id: user for user in users_result.scalars().all()}


def _export_pagination() -> PaginationInput:
    return PaginationInput(page_index=0, page_size=EXPORT_MAX_ROWS)


async def _fetch_tasks(info, request: TableExportRequest) -> list[models.Task]:
    from api.resolvers.task import TaskQuery

    return await TaskQuery().tasks(
        info,
        patient_id=request.patient_id,
        assignee_id=request.assignee_id,
        assignee_team_id=request.assignee_team_id,
        root_location_ids=request.root_location_ids,
        filters=request.query_filters(),
        sorts=request.query_sorts(),
        pagination=_export_pagination(),
        search=request.query_search(),
    )


async def _fetch_patients(
    info,
    request: TableExportRequest,
) -> list[models.Patient]:
    from api.resolvers.patient import PatientQuery

    return await PatientQuery().patients(
        info,
        location_node_id=request.location_node_id,
        root_location_ids=request.root_location_ids,
        states=request.states,
        filters=request.query_filters(),
        sorts=request.query_sorts(),
        pagination=_export_pagination(),
        search=request.query_search(),
    )


async def run_table_export(
    context: Context,
    entity: str,
    request: TableExportRequest,
) -> ExportResult:
    info = SimpleNamespace(context=context)
    db = context.db
    tz = _resolve_timezone(request.timezone)
    ctx = ExportContext(
        labels=get_labels(request.locale),
        formats=get_formats(request.locale),
        tz=tz,
        now=datetime.now(tz).replace(tzinfo=None),
    )
    ctx.locations = await _load_locations(db)

    if entity == "tasks":
        records = await _fetch_tasks(info, request)
        await _load_property_data(
            db,
            ctx,
            models.PropertyValue.task_id,
            [task.id for task in records],
        )
        resolve_cell = task_cell
        default_title = ctx.labels["tasks_title"]
    else:
        records = await _fetch_patients(info, request)
        await _load_property_data(
            db,
            ctx,
            models.PropertyValue.patient_id,
            [patient.id for patient in records],
        )
        resolve_cell = patient_cell
        default_title = ctx.labels["patients_title"]

    title = (request.title or "").strip() or default_title
    headers = [column.label for column in request.columns]
    rows: list[list[ExportCell]] = [
        [resolve_cell(record, column.key, ctx) for column in request.columns]
        for record in records
    ]

    timestamp = ctx.now.strftime("%Y-%m-%d_%H-%M")
    base_filename = f"{_slugify_filename(title)}_{timestamp}"
    if request.format == "csv":
        return ExportResult(
            content=render_csv(headers, rows, ctx),
            media_type=CSV_MEDIA_TYPE,
            filename=f"{base_filename}.csv",
        )
    return ExportResult(
        content=render_xlsx(headers, rows, ctx, title),
        media_type=XLSX_MEDIA_TYPE,
        filename=f"{base_filename}.xlsx",
    )
