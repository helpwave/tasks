import json
import logging
from pathlib import Path
from typing import Any

from api.inputs import LocationType
from config import LOGGER, SCAFFOLD_DIRECTORY
from database.models.location import LocationNode, location_organizations
from database.models.user import User
from database.session import async_session
from sqlalchemy import select

logger = logging.getLogger(LOGGER)


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

    async with async_session() as session:
        result = await session.execute(select(LocationNode).limit(1))
        existing_location = result.scalar_one_or_none()

        if existing_location:
            logger.info(
                "Location nodes already exist in database, skipping scaffold loading"
            )
            return

        json_files = list(scaffold_path.glob("*.json"))

        if not json_files:
            logger.info(
                f"No JSON files found in {SCAFFOLD_DIRECTORY}, skipping scaffold loading"
            )
            return

        logger.info(
            f"Loading scaffold data from {len(json_files)} JSON file(s) in {SCAFFOLD_DIRECTORY}"
        )

        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if isinstance(data, list):
                    for item in data:
                        await _create_location_tree(session, item, None)
                elif isinstance(data, dict):
                    await _create_location_tree(session, data, None)
                else:
                    logger.warning(
                        f"Invalid JSON structure in {json_file}, expected list or object"
                    )

                await session.commit()
                logger.info(
                    f"Successfully loaded scaffold data from {json_file}"
                )
                await _assign_clinics_to_users(session)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON file {json_file}: {e}")
                await session.rollback()
            except Exception as e:
                logger.error(
                    f"Error loading scaffold data from {json_file}: {e}"
                )
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


async def _assign_clinics_to_users(session: Any) -> None:
    result = await session.execute(select(User))
    users = result.scalars().all()

    for user in users:
        if not user.organizations:
            continue

        org_ids = [
            org_id.strip()
            for org_id in user.organizations.split(",")
            if org_id.strip()
        ]

        for org_id in org_ids:
            clinic_result = await session.execute(
                select(LocationNode)
                .join(
                    location_organizations,
                    LocationNode.id == location_organizations.c.location_id,
                )
                .where(
                    LocationNode.kind == "CLINIC",
                    location_organizations.c.organization_id == org_id,
                )
                .limit(1)
            )
            clinic = clinic_result.scalar_one_or_none()

            if clinic:
                from database.models.user import user_root_locations

                existing_result = await session.execute(
                    select(user_root_locations).where(
                        user_root_locations.c.user_id == user.id,
                        user_root_locations.c.location_id == clinic.id,
                    )
                )
                existing = existing_result.first()
                if not existing:
                    await session.execute(
                        user_root_locations.insert().values(
                            user_id=user.id, location_id=clinic.id
                        )
                    )
                    logger.info(
                        f"Assigned clinic '{clinic.title}' to user '{user.username}' based on organization '{org_id}'"
                    )

    await session.commit()
