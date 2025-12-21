from collections.abc import AsyncGenerator

from database.session import redis_client


async def create_redis_subscription(
    channel: str,
    filter_id: str | None = None,
) -> AsyncGenerator[str, None]:
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                message_id = message["data"]
                if filter_id is None or message_id == filter_id:
                    yield message_id
    finally:
        await pubsub.close()
