"""End-to-end smoke test for the *configured* schema and its extensions.

The resolver-level tests call resolvers directly and never exercise
``schema.execute``, so a misconfigured extension list (e.g. a factory that the
installed Strawberry version calls with ``execution_context``) would slip
through. This test runs a query through the real schema wired up in ``main``.
"""

import pytest


class _Ctx:
    def __init__(self, user=None):
        self.user = user


@pytest.mark.asyncio
async def test_configured_schema_executes_introspection_for_anonymous():
    import main

    result = await main.schema.execute(
        "{ __typename }", context_value=_Ctx(user=None)
    )
    assert result.errors is None
    assert result.data == {"__typename": "Query"}


@pytest.mark.asyncio
async def test_configured_schema_denies_data_for_anonymous():
    import main

    result = await main.schema.execute(
        "{ users { id } }", context_value=_Ctx(user=None)
    )
    assert result.data is None
    assert result.errors
    assert result.errors[0].extensions.get("code") == "UNAUTHENTICATED"
