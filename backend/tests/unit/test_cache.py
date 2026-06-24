import pytest

from api.services import cache as cache_mod
from api.services.cache import (
    get_cached_accessible_location_ids,
    invalidate_scope_for_entity,
    set_cached_accessible_location_ids,
)


class FakeRedis:
    def __init__(self):
        self.store = {}
        self.ttls = {}

    async def get(self, key):
        return self.store.get(key)

    async def set(self, key, value, ex=None):
        self.store[key] = value
        self.ttls[key] = ex
        return True

    async def delete(self, *keys):
        removed = 0
        for key in keys:
            if key in self.store:
                del self.store[key]
                removed += 1
        return removed

    async def incr(self, key):
        current = int(self.store.get(key, 0)) + 1
        self.store[key] = str(current)
        return current


class FailingRedis:
    async def get(self, *args, **kwargs):
        raise RuntimeError("redis down")

    async def set(self, *args, **kwargs):
        raise RuntimeError("redis down")

    async def delete(self, *args, **kwargs):
        raise RuntimeError("redis down")

    async def incr(self, *args, **kwargs):
        raise RuntimeError("redis down")


@pytest.fixture
def fake_cache():
    fake = FakeRedis()
    previous = cache_mod.get_cache()._client
    cache_mod.get_cache()._client = fake
    yield fake
    cache_mod.get_cache()._client = previous


@pytest.fixture
def failing_cache():
    previous = cache_mod.get_cache()._client
    cache_mod.get_cache()._client = FailingRedis()
    yield
    cache_mod.get_cache()._client = previous


async def test_set_and_get_json_roundtrip(fake_cache):
    cache = cache_mod.get_cache()
    await cache.set_json("k", {"a": 1, "b": [2, 3]})
    assert await cache.get_json("k") == {"a": 1, "b": [2, 3]}


async def test_get_json_miss_returns_none(fake_cache):
    assert await cache_mod.get_cache().get_json("missing") is None


async def test_set_json_passes_ttl(fake_cache):
    await cache_mod.get_cache().set_json("k", [1, 2], ttl_seconds=42)
    assert fake_cache.ttls["k"] == 42


async def test_graceful_fallback_when_redis_unavailable(failing_cache):
    cache = cache_mod.get_cache()
    assert await cache.get_json("k") is None
    await cache.set_json("k", {"a": 1})
    assert await cache.increment("v") is None
    assert await cache.get_int("v") == 0


async def test_accessible_locations_roundtrip(fake_cache):
    await set_cached_accessible_location_ids("user-1", {"loc-a", "loc-b"})
    assert await get_cached_accessible_location_ids("user-1") == {"loc-a", "loc-b"}


async def test_location_change_versions_out_cached_scope(fake_cache):
    await set_cached_accessible_location_ids("user-1", {"loc-a"})
    assert await get_cached_accessible_location_ids("user-1") == {"loc-a"}

    await invalidate_scope_for_entity("location_node")

    assert await get_cached_accessible_location_ids("user-1") is None


async def test_non_scope_entity_does_not_invalidate(fake_cache):
    await set_cached_accessible_location_ids("user-1", {"loc-a"})
    await invalidate_scope_for_entity("task")
    assert await get_cached_accessible_location_ids("user-1") == {"loc-a"}


async def test_authorization_service_caches_and_reuses_scope(db_session, fake_cache):
    from api.services.authorization import AuthorizationService
    from database import models

    root = models.LocationNode(id="loc-root", title="Root", kind="WARD")
    child = models.LocationNode(
        id="loc-child", title="Child", kind="ROOM", parent_id="loc-root"
    )
    user = models.User(
        id="auth-user",
        username="authuser",
        firstname="Auth",
        lastname="User",
        title="",
    )
    db_session.add_all([root, child, user])
    await db_session.commit()
    await db_session.execute(
        models.user_root_locations.insert().values(
            user_id="auth-user", location_id="loc-root"
        )
    )
    await db_session.commit()

    service = AuthorizationService(db_session)
    first = await service.get_user_accessible_location_ids(user, context=None)
    assert first == {"loc-root", "loc-child"}
    assert await get_cached_accessible_location_ids("auth-user") == {
        "loc-root",
        "loc-child",
    }

    async def _should_not_run(*args, **kwargs):
        raise AssertionError("compute must not run on a cache hit")

    service._compute_accessible_location_ids = _should_not_run  # type: ignore[method-assign]
    second = await service.get_user_accessible_location_ids(user, context=None)
    assert second == {"loc-root", "loc-child"}
