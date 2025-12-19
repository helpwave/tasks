import logging
from collections.abc import AsyncGenerator

import redis.asyncio as redis
from config import DATABASE_URL, REDIS_URL, LOGGER
from database.models.base import Base
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

logger = logging.getLogger(LOGGER)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


async def publish_to_redis(channel: str, message: str) -> None:
    try:
        logger.info(f"Publishing to Redis: channel={channel}, message={message}")
        await redis_client.publish(channel, message)
        logger.debug(f"Successfully published to Redis: channel={channel}, message={message}")
    except Exception as e:
        logger.error(f"Failed to publish to Redis: channel={channel}, message={message}, error={e}")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
