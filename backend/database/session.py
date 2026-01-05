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
        logger.debug(
            f"[SUBSCRIPTION] Publishing to Redis: channel={channel}, message={message}"
        )
        await redis_client.publish(channel, message)
        logger.debug(
            f"[SUBSCRIPTION] Successfully published to Redis: channel={channel}, message={message}"
        )
    except RuntimeError as e:
        error_str = str(e)
        if "Event loop is closed" in error_str or "attached to a different loop" in error_str:
            logger.warning(
                f"[SUBSCRIPTION] Skipping Redis publish due to event loop issue: channel={channel}, message={message}, error={error_str}"
            )
            return
        logger.error(
            f"[SUBSCRIPTION] Failed to publish to Redis: channel={channel}, message={message}, error={error_str}",
            exc_info=True
        )
        raise
    except Exception as e:
        logger.error(
            f"[SUBSCRIPTION] Failed to publish to Redis: channel={channel}, message={message}, error={e}",
            exc_info=True
        )
        raise


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
