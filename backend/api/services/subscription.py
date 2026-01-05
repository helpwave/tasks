import logging
from collections.abc import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import models
from database.session import redis_client

logger = logging.getLogger(__name__)


async def create_redis_subscription(
    channel: str,
    filter_id: str | None = None,
) -> AsyncGenerator[str, None]:
    logger.debug(
        f"[SUBSCRIPTION] Subscribing to Redis channel: channel={channel}, filter_id={filter_id}"
    )
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)
    logger.debug(
        f"[SUBSCRIPTION] Successfully subscribed to Redis channel: channel={channel}"
    )
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                message_id = message["data"]
                logger.debug(
                    f"[SUBSCRIPTION] Received message from Redis channel: "
                    f"channel={channel}, message_id={message_id}, filter_id={filter_id}"
                )
                if filter_id is None or message_id == filter_id:
                    logger.debug(
                        f"[SUBSCRIPTION] Dispatching message to resolver: "
                        f"channel={channel}, message_id={message_id}"
                    )
                    yield message_id
                else:
                    logger.debug(
                        f"[SUBSCRIPTION] Filtered out message (filter mismatch): "
                        f"channel={channel}, message_id={message_id}, filter_id={filter_id}"
                    )
    finally:
        logger.debug(
            f"[SUBSCRIPTION] Unsubscribing from Redis channel: channel={channel}"
        )
        await pubsub.close()


async def patient_belongs_to_root_locations(
    db: AsyncSession,
    patient_id: str,
    root_location_ids: list[str],
) -> bool:
    if not root_location_ids:
        return True

    result = await db.execute(
        select(models.Patient)
        .where(models.Patient.id == patient_id)
        .options(
            selectinload(models.Patient.assigned_locations),
            selectinload(models.Patient.teams),
        )
    )
    patient = result.scalars().first()

    if not patient:
        return False

    root_cte = (
        select(models.LocationNode.id)
        .where(
            models.LocationNode.id.in_(root_location_ids)
        )
        .cte(name="root_location_descendants", recursive=True)
    )
    root_children = select(models.LocationNode.id).join(
        root_cte, models.LocationNode.parent_id == root_cte.c.id
    )
    root_cte = root_cte.union_all(root_children)

    result = await db.execute(select(root_cte.c.id))
    root_location_descendants = {row[0] for row in result.all()}

    if patient.clinic_id in root_location_descendants:
        return True

    if (
        patient.position_id
        and patient.position_id in root_location_descendants
    ):
        return True

    if (
        patient.assigned_location_id
        and patient.assigned_location_id
        in root_location_descendants
    ):
        return True

    if patient.assigned_locations:
        for location in patient.assigned_locations:
            if location.id in root_location_descendants:
                return True

    if patient.teams:
        for team in patient.teams:
            if team.id in root_location_descendants:
                return True

    return False


async def task_belongs_to_root_locations(
    db: AsyncSession,
    task_id: str,
    root_location_ids: list[str],
) -> bool:
    if not root_location_ids:
        return True

    result = await db.execute(
        select(models.Task)
        .where(models.Task.id == task_id)
        .options(
            selectinload(models.Task.patient).selectinload(
                models.Patient.assigned_locations
            ),
            selectinload(models.Task.patient).selectinload(
                models.Patient.teams
            ),
        )
    )
    task = result.scalars().first()

    if not task or not task.patient:
        return False

    return await patient_belongs_to_root_locations(
        db, task.patient.id, root_location_ids
    )
