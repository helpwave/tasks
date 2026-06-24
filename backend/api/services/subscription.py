import asyncio
import logging
from collections.abc import AsyncGenerator, Awaitable, Callable

from redis import exceptions as redis_exceptions
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import models
from database.session import redis_client

logger = logging.getLogger(__name__)

_SUBSCRIPTION_READ_TIMEOUT_SECONDS = 30.0
_SUBSCRIPTION_RECONNECT_DELAY_SECONDS = 0.5


async def create_redis_subscription(
    channel: str,
    filter_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """Yield message ids published to ``channel``, surviving idle gaps.

    A long-lived blocking read returns empty whenever the channel is idle; that
    is normal and must not tear the subscription down (the previous
    ``pubsub.listen()`` propagated such read timeouts and crashed the
    subscription). Read timeouts are therefore treated as "no message yet" and a
    dropped connection reconnects instead of ending the stream. Cancellation
    (the client going away) propagates out and closes the pubsub.
    """
    while True:
        pubsub = redis_client.pubsub()
        try:
            await pubsub.subscribe(channel)
            while True:
                try:
                    message = await pubsub.get_message(
                        ignore_subscribe_messages=True,
                        timeout=_SUBSCRIPTION_READ_TIMEOUT_SECONDS,
                    )
                except (redis_exceptions.TimeoutError, asyncio.TimeoutError):
                    continue
                if message is None or message.get("type") != "message":
                    continue
                message_id = message["data"]
                if filter_id is None or message_id == filter_id:
                    yield message_id
        except (redis_exceptions.ConnectionError, redis_exceptions.TimeoutError) as error:
            logger.warning(
                f"[SUBSCRIPTION] Redis connection lost on channel={channel}, reconnecting: {error}"
            )
            await asyncio.sleep(_SUBSCRIPTION_RECONNECT_DELAY_SECONDS)
        finally:
            try:
                await pubsub.close()
            except Exception:
                pass


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

    if not task:
        return False

    if task.patient:
        return await patient_belongs_to_root_locations(
            db, task.patient.id, root_location_ids
        )

    if not task.assignee_team_id:
        return False

    root_cte = (
        select(models.LocationNode.id)
        .where(models.LocationNode.id.in_(root_location_ids))
        .cte(name="root_location_descendants", recursive=True)
    )
    root_children = select(models.LocationNode.id).join(
        root_cte, models.LocationNode.parent_id == root_cte.c.id
    )
    root_cte = root_cte.union(root_children)
    result = await db.execute(select(root_cte.c.id))
    root_location_descendants = {row[0] for row in result.all()}
    return task.assignee_team_id in root_location_descendants


async def subscribe_with_location_filter(
    entity_id_iterator: AsyncGenerator[str, None],
    db: AsyncSession,
    root_location_ids: list[str] | None,
    belongs_check: Callable[
        [AsyncSession, str, list[str]], Awaitable[bool]
    ],
) -> AsyncGenerator[str, None]:
    if not root_location_ids:
        async for entity_id in entity_id_iterator:
            yield entity_id
        return
    async for entity_id in entity_id_iterator:
        if await belongs_check(db, str(entity_id), root_location_ids):
            yield entity_id
