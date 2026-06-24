import pytest
import redis.asyncio as redis

from config import REDIS_URL
from database.session import publish_to_redis


@pytest.mark.asyncio
async def test_configured_redis_url_connects_and_round_trips():
    client = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        key = "test:redis-setup:roundtrip"
        await client.set(key, "ok", ex=10)
        assert await client.get(key) == "ok"
        await client.delete(key)
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_entity_notification_publish_does_not_raise():
    await publish_to_redis("test_redis_setup_channel", "payload")
