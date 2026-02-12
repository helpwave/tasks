import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any

from api.inputs import LocationType
from config import (
    LOGGER,
    SCAFFOLD_DIRECTORY,
    SCAFFOLD_STRATEGY,
    ScaffoldStrategy,
)
from database.models.location import LocationNode, location_organizations
from database.models.patient import Patient, patient_locations, patient_teams
from database.models.scaffold import ScaffoldImportState
from database.models.task import Task
from database.models.user import user_root_locations
from database.session import async_session
from sqlalchemy import delete, select, update

logger = logging.getLogger(LOGGER)

REINITIALIZATION_WAIT_SECONDS = 120


def _compute_scaffold_directory_hash(scaffold_path: Path) -> str:
    parts: list[str] = []
    for path in sorted(scaffold_path.glob("*.json")):
        parts.append(path.name)
        parts.append(path.stat().st_mtime_ns.__str__())
        parts.append(path.stat().st_size.__str__())
        with open(path, "rb") as f:
            parts.append(hashlib.sha256(f.read()).hexdigest())
    return hashlib.sha256("".join(parts).encode()).hexdigest()


SCAFFOLD_STATE_KEY = "directory_hash"
FALLBACK_CLINIC_TITLE = "FALLBACK_CLINIC"


def _load_and_merge_json_payload(scaffold_path: Path) -> list[dict[str, Any]]:
    json_files = sorted(scaffold_path.glob("*.json"))
    merged: list[dict[str, Any]] = []
    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                merged.extend(data)
            elif isinstance(data, dict):
                merged.append(data)
            else:
                logger.warning(
                    f"Invalid JSON structure in {json_file}, expected list or object"
                )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON file {json_file}: {e}")
    return merged


async def load_scaffold_data() -> None:
    if not SCAFFOLD_DIRECTORY:
        logger.info("SCAFFOLD_DIRECTORY not set, skipping scaffold loading")
        return

    scaffold_path = Path(SCAFFOLD_DIRECTORY)
    if not scaffold_path.exists():
        logger.warning(
            f"Scaffold directory {SCAFFOLD_DIRECTORY} does not exist, skipping"
        )
        return

    if not scaffold_path.is_dir():
        logger.warning(
            f"Scaffold path {SCAFFOLD_DIRECTORY} is not a directory, skipping"
        )
        return

    payload = _load_and_merge_json_payload(scaffold_path)
    if not payload:
        logger.info(
            f"No valid JSON root items in {SCAFFOLD_DIRECTORY}, skipping scaffold loading"
        )
        return

    json_files = list(scaffold_path.glob("*.json"))
    logger.info(
        f"Loading scaffold data from {len(json_files)} JSON file(s) in {SCAFFOLD_DIRECTORY}, "
        f"merged into {len(payload)} root item(s), strategy={SCAFFOLD_STRATEGY.value}"
    )

    current_hash: str | None = None
    if SCAFFOLD_STRATEGY in (ScaffoldStrategy.MERGE, ScaffoldStrategy.FORCE):
        current_hash = _compute_scaffold_directory_hash(scaffold_path)

    async with async_session() as session:
        fallback_result = await session.execute(
            select(LocationNode.id).where(
                LocationNode.title == FALLBACK_CLINIC_TITLE,
                LocationNode.parent_id.is_(None),
                LocationNode.kind == "CLINIC",
            )
        )
        fallback_id = fallback_result.scalar_one_or_none()
        if fallback_id is not None:
            patient_ref = await session.execute(
                select(Patient.id).where(
                    Patient.clinic_id == fallback_id
                ).limit(1)
            )
            user_root_ref = await session.execute(
                select(user_root_locations.c.location_id).where(
                    user_root_locations.c.location_id == fallback_id
                ).limit(1)
            )
            task_ref = await session.execute(
                select(Task.id).where(
                    Task.assignee_team_id == fallback_id
                ).limit(1)
            )
            team_ref = await session.execute(
                select(patient_teams.c.location_id).where(
                    patient_teams.c.location_id == fallback_id
                ).limit(1)
            )
            if (
                patient_ref.scalar_one_or_none() is None
                and user_root_ref.scalar_one_or_none() is None
                and task_ref.scalar_one_or_none() is None
                and team_ref.scalar_one_or_none() is None
            ):
                await session.execute(
                    delete(location_organizations).where(
                        location_organizations.c.location_id == fallback_id
                    )
                )
                await session.execute(
                    delete(LocationNode).where(LocationNode.id == fallback_id)
                )
                await session.flush()
                logger.info(
                    "Removed unused FALLBACK_CLINIC (no references)"
                )

        if SCAFFOLD_STRATEGY in (ScaffoldStrategy.MERGE, ScaffoldStrategy.FORCE):
            result = await session.execute(
                select(ScaffoldImportState.value).where(
                    ScaffoldImportState.key == SCAFFOLD_STATE_KEY
                )
            )
            last_hash: str | None = result.scalar_one_or_none()
            if last_hash == current_hash:
                logger.info(
                    "Scaffold directory unchanged (DB state), "
                    "skipping reinitialization wait"
                )
            else:
                logger.warning(
                    "Scaffold directory changed or first run. "
                    "Waiting %d seconds for reinitialization...",
                    REINITIALIZATION_WAIT_SECONDS,
                )
                time.sleep(REINITIALIZATION_WAIT_SECONDS)

        if SCAFFOLD_STRATEGY == ScaffoldStrategy.CHECK:
            result = await session.execute(select(LocationNode).limit(1))
            if result.scalar_one_or_none():
                logger.info(
                    "Location nodes already exist (CHECK strategy), skipping scaffold loading"
                )
                return

        if SCAFFOLD_STRATEGY == ScaffoldStrategy.FORCE:
            personal_ids_result = await session.execute(
                select(LocationNode.id).where(
                    LocationNode.parent_id.is_(None),
                    LocationNode.title.like("%'s Organization"),
                    ~LocationNode.id.in_(
                        select(location_organizations.c.location_id)
                    ),
                )
            )
            personal_location_ids = {
                row[0] for row in personal_ids_result.all()
            }

            result = await session.execute(
                select(Patient.id).where(Patient.clinic_id.isnot(None)).limit(1)
            )
            has_patients_with_clinic = result.scalar_one_or_none() is not None
            fallback_clinic_id: str | None = None
            if has_patients_with_clinic:
                fallback_clinic = LocationNode(
                    title=FALLBACK_CLINIC_TITLE,
                    kind="CLINIC",
                    parent_id=None,
                )
                session.add(fallback_clinic)
                await session.flush()
                fallback_clinic_id = fallback_clinic.id
                await session.execute(
                    location_organizations.insert().values(
                        location_id=fallback_clinic_id,
                        organization_id="global",
                    )
                )
                await session.execute(
                    update(Patient)
                    .where(Patient.clinic_id.isnot(None))
                    .values(clinic_id=fallback_clinic_id)
                )

            await session.execute(delete(patient_locations))
            await session.execute(delete(patient_teams))
            await session.execute(
                delete(user_root_locations).where(
                    ~user_root_locations.c.location_id.in_(personal_location_ids)
                )
            )
            await session.execute(update(Task).values(assignee_team_id=None))

            ids_to_keep = set(personal_location_ids)
            if fallback_clinic_id is not None:
                ids_to_keep.add(fallback_clinic_id)
            all_ids_result = await session.execute(select(LocationNode.id))
            all_ids = {row[0] for row in all_ids_result.all()}
            ids_to_delete = all_ids - ids_to_keep

            if ids_to_delete:
                await session.execute(
                    update(Patient)
                    .where(
                        Patient.assigned_location_id.in_(ids_to_delete)
                    )
                    .values(assigned_location_id=None)
                )
                await session.execute(
                    update(Patient)
                    .where(Patient.position_id.in_(ids_to_delete))
                    .values(position_id=None)
                )
                await session.execute(
                    delete(location_organizations).where(
                        location_organizations.c.location_id.in_(ids_to_delete)
                    )
                )
                await session.execute(
                    update(LocationNode)
                    .where(LocationNode.id.in_(ids_to_delete))
                    .values(parent_id=None)
                )
                await session.execute(
                    delete(LocationNode).where(
                        LocationNode.id.in_(ids_to_delete)
                    )
                )
            await session.flush()

        try:
            for item in payload:
                await _create_location_tree(session, item, None)
            if (
                current_hash is not None
                and SCAFFOLD_STRATEGY in (ScaffoldStrategy.MERGE, ScaffoldStrategy.FORCE)
            ):
                existing = await session.execute(
                    select(ScaffoldImportState).where(
                        ScaffoldImportState.key == SCAFFOLD_STATE_KEY
                    )
                )
                row = existing.scalar_one_or_none()
                if row:
                    row.value = current_hash
                else:
                    session.add(
                        ScaffoldImportState(
                            key=SCAFFOLD_STATE_KEY,
                            value=current_hash,
                        )
                    )
            await session.commit()
            logger.info("Successfully loaded scaffold data (single import)")
        except Exception as e:
            logger.error(f"Error loading scaffold data: {e}")
            await session.rollback()


async def _create_location_tree(
    session: Any,
    data: dict[str, Any],
    parent_id: str | None,
) -> str:
    name = data.get("name", "")
    type_str = data.get("type", "").upper()
    children = data.get("children", [])

    try:
        location_type = LocationType[type_str]
    except KeyError:
        logger.warning(f"Unknown location type '{type_str}', using OTHER")
        location_type = LocationType.OTHER

    stmt = select(LocationNode).where(
        LocationNode.title == name,
        LocationNode.kind == location_type.value,
        LocationNode.parent_id == parent_id,
    )
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        location_id = existing.id
        logger.debug(f"Location '{name}' already exists, skipping creation")
    else:
        location = LocationNode(
            title=name,
            kind=location_type.value,
            parent_id=parent_id,
        )
        session.add(location)
        await session.flush()
        location_id = location.id
        logger.debug(f"Created location '{name}' ({location_type.value})")

    organization_ids = data.get("organization_ids", [])
    if organization_ids:
        allowed_types_for_orgs = {"HOSPITAL", "CLINIC", "PRACTICE", "TEAM", "WARD"}
        if location_type.value not in allowed_types_for_orgs:
            logger.warning(
                f"Organization IDs can only be assigned to HOSPITAL, CLINIC, PRACTICE, TEAM, or WARD. "
                f"Skipping organization assignment for location '{name}' (type: {location_type.value})"
            )
        else:
            for org_id in organization_ids:
                stmt = select(location_organizations).where(
                    location_organizations.c.location_id == location_id,
                    location_organizations.c.organization_id == org_id,
                )
                result = await session.execute(stmt)
                existing_org = result.first()
                if not existing_org:
                    await session.execute(
                        location_organizations.insert().values(
                            location_id=location_id, organization_id=org_id
                        )
                    )
                    logger.debug(
                        f"Assigned organization '{org_id}' to location '{name}'"
                    )

    for child_data in children:
        await _create_location_tree(session, child_data, location_id)

    return location_id
