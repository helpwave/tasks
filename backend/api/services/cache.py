import json
import logging
from typing import Any, Iterable

from config import ACCESSIBLE_LOCATIONS_CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

ACCESSIBLE_LOCATIONS_TTL_SECONDS = ACCESSIBLE_LOCATIONS_CACHE_TTL_SECONDS

_SCOPE_VERSION_KEY = "authz:scope_version"
_ACCESSIBLE_LOCATIONS_PREFIX = "authz:accessible_locations"
_SCOPE_AFFECTING_ENTITY_TYPES = {"location", "location_node"}


class RedisCache:
    def __init__(self, client: Any = None) -> None:
        self._client = client

    @property
    def client(self) -> Any:
        if self._client is not None:
            return self._client
        from database.session import redis_client

        return redis_client

    async def get_json(self, key: str) -> Any | None:
        try:
            raw = await self.client.get(key)
        except Exception as error:
            logger.warning(f"[CACHE] get failed for key={key}: {error}")
            return None
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (ValueError, TypeError) as error:
            logger.warning(f"[CACHE] decode failed for key={key}: {error}")
            return None

    async def set_json(
        self, key: str, value: Any, ttl_seconds: int | None = None
    ) -> None:
        try:
            payload = json.dumps(value)
        except (TypeError, ValueError) as error:
            logger.warning(f"[CACHE] encode failed for key={key}: {error}")
            return
        try:
            if ttl_seconds is not None:
                await self.client.set(key, payload, ex=ttl_seconds)
            else:
                await self.client.set(key, payload)
        except Exception as error:
            logger.warning(f"[CACHE] set failed for key={key}: {error}")

    async def delete(self, *keys: str) -> None:
        if not keys:
            return
        try:
            await self.client.delete(*keys)
        except Exception as error:
            logger.warning(f"[CACHE] delete failed for keys={keys}: {error}")

    async def increment(self, key: str) -> int | None:
        try:
            return await self.client.incr(key)
        except Exception as error:
            logger.warning(f"[CACHE] incr failed for key={key}: {error}")
            return None

    async def get_int(self, key: str) -> int:
        try:
            raw = await self.client.get(key)
        except Exception as error:
            logger.warning(f"[CACHE] get_int failed for key={key}: {error}")
            return 0
        if raw is None:
            return 0
        try:
            return int(raw)
        except (ValueError, TypeError):
            return 0


_cache = RedisCache()


def get_cache() -> RedisCache:
    return _cache


async def _scope_version() -> int:
    return await _cache.get_int(_SCOPE_VERSION_KEY)


def _accessible_locations_key(user_id: str, version: int) -> str:
    return f"{_ACCESSIBLE_LOCATIONS_PREFIX}:v{version}:{user_id}"


async def get_cached_accessible_location_ids(user_id: str) -> set[str] | None:
    version = await _scope_version()
    cached = await _cache.get_json(_accessible_locations_key(user_id, version))
    if cached is None:
        return None
    if not isinstance(cached, list):
        return None
    return {str(value) for value in cached}


async def set_cached_accessible_location_ids(
    user_id: str, location_ids: Iterable[str]
) -> None:
    version = await _scope_version()
    await _cache.set_json(
        _accessible_locations_key(user_id, version),
        sorted({str(value) for value in location_ids}),
        ttl_seconds=ACCESSIBLE_LOCATIONS_TTL_SECONDS,
    )


async def invalidate_accessible_location_scope() -> None:
    await _cache.increment(_SCOPE_VERSION_KEY)


async def invalidate_scope_for_entity(entity_type: str | None) -> None:
    if entity_type in _SCOPE_AFFECTING_ENTITY_TYPES:
        await invalidate_accessible_location_scope()
