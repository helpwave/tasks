from database.session import publish_to_redis


async def notify_entity_update(
    entity_type: str,
    entity_id: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
) -> None:
    await publish_to_redis(f"{entity_type}_updated", str(entity_id))
    if related_entity_type and related_entity_id:
        await publish_to_redis(f"{related_entity_type}_updated", str(related_entity_id))


async def notify_entity_created(entity_type: str, entity_id: str) -> None:
    await publish_to_redis(f"{entity_type}_created", str(entity_id))


async def notify_entity_deleted(
    entity_type: str,
    entity_id: str,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
) -> None:
    await publish_to_redis(f"{entity_type}_deleted", str(entity_id))
    if related_entity_type and related_entity_id:
        await publish_to_redis(f"{related_entity_type}_updated", str(related_entity_id))
