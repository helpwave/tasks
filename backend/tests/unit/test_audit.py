import asyncio

import pytest

from api import audit as audit_module
from api.audit import _schedule_audit_log, audit_log


class _FakeUser:
    id = "user-1"


class _FakeContext:
    user = _FakeUser()


class _FakeInfo:
    context = _FakeContext()


class _Result:
    id = "entity-1"


@pytest.mark.asyncio
async def test_audit_log_returns_result_and_writes_in_background(monkeypatch):
    calls: list[tuple] = []

    def fake_log_activity(case_id, activity_name, user_id=None, context=None):
        calls.append((case_id, activity_name, user_id))

    monkeypatch.setattr(audit_module.AuditLogger, "log_activity", fake_log_activity)

    @audit_log("update_patient")
    async def do_thing(self, info, id):
        return _Result()

    result = await do_thing(None, _FakeInfo(), id="entity-1")

    assert result.id == "entity-1"
    pending = list(audit_module._pending_audit_tasks)
    assert pending, "audit write must be scheduled off the response path"

    await asyncio.gather(*pending)
    assert calls == [("entity-1", "update_patient", "user-1")]


def test_schedule_audit_log_falls_back_without_running_loop(monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(
        audit_module.AuditLogger,
        "log_activity",
        lambda case_id, activity_name, user_id=None, context=None: calls.append(case_id),
    )

    _schedule_audit_log("case-1", "activity", "user-1", {})

    assert calls == ["case-1"]
