import logging

from database.session import publish_to_redis

logger = logging.getLogger(__name__)


async def notify_entity_update(
    entity_type: str,
    entity_id: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
    location_ids: list[str] | None = None,
) -> None:
    channel = f"{entity_type}_updated"
    logger.info(
        f"[SUBSCRIPTION] Publishing entity update: entity_type={entity_type}, "
        f"entity_id={entity_id}, channel={channel}, "
        f"location_ids={location_ids}, related_entity={related_entity_type}:{related_entity_id}"
    )
    await publish_to_redis(channel, str(entity_id))
    logger.info(
        f"[SUBSCRIPTION] Successfully published entity update: "
        f"entity_type={entity_type}, entity_id={entity_id}, channel={channel}"
    )
    if related_entity_type and related_entity_id:
        related_channel = f"{related_entity_type}_updated"
        logger.info(
            f"[SUBSCRIPTION] Publishing related entity update: "
            f"entity_type={related_entity_type}, entity_id={related_entity_id}, "
            f"channel={related_channel}"
        )
        await publish_to_redis(related_channel, str(related_entity_id))
        logger.info(
            f"[SUBSCRIPTION] Successfully published related entity update: "
            f"entity_type={related_entity_type}, entity_id={related_entity_id}, "
            f"channel={related_channel}"
        )


async def notify_entity_created(
    entity_type: str,
    entity_id: str,
    location_ids: list[str] | None = None,
) -> None:
    channel = f"{entity_type}_created"
    logger.info(
        f"[SUBSCRIPTION] Publishing entity creation: entity_type={entity_type}, "
        f"entity_id={entity_id}, channel={channel}, location_ids={location_ids}"
    )
    await publish_to_redis(channel, str(entity_id))
    logger.info(
        f"[SUBSCRIPTION] Successfully published entity creation: "
        f"entity_type={entity_type}, entity_id={entity_id}, channel={channel}"
    )


async def notify_entity_deleted(
    entity_type: str,
    entity_id: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
    location_ids: list[str] | None = None,
) -> None:
    channel = f"{entity_type}_deleted"
    logger.info(
        f"[SUBSCRIPTION] Publishing entity deletion: entity_type={entity_type}, "
        f"entity_id={entity_id}, channel={channel}, location_ids={location_ids}, "
        f"related_entity={related_entity_type}:{related_entity_id}"
    )
    await publish_to_redis(channel, str(entity_id))
    logger.info(
        f"[SUBSCRIPTION] Successfully published entity deletion: "
        f"entity_type={entity_type}, entity_id={entity_id}, channel={channel}"
    )
    if related_entity_type and related_entity_id:
        related_channel = f"{related_entity_type}_updated"
        logger.info(
            f"[SUBSCRIPTION] Publishing related entity update after deletion: "
            f"entity_type={related_entity_type}, entity_id={related_entity_id}, "
            f"channel={related_channel}"
        )
        await publish_to_redis(related_channel, str(related_entity_id))
        logger.info(
            f"[SUBSCRIPTION] Successfully published related entity update: "
            f"entity_type={related_entity_type}, entity_id={related_entity_id}, "
            f"channel={related_channel}"
        )
