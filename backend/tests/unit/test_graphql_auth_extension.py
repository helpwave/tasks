import strawberry
import pytest

from api.extensions import GlobalAuthExtension


@strawberry.type
class _Query:
    @strawberry.field
    def secret(self) -> str:
        return "TOP-SECRET"


class _Ctx:
    def __init__(self, user=None):
        self.user = user


_schema = strawberry.Schema(query=_Query, extensions=[GlobalAuthExtension])


async def _run(query: str, user=None):
    return await _schema.execute(query, context_value=_Ctx(user))


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "query",
    [
        "{ secret }",
        "{ ... on Query { secret } }",
        "query { ...F } fragment F on Query { secret }",
        "query { ...A } fragment A on Query { ...B } fragment B on Query { secret }",
        "query { alias: secret }",
    ],
)
async def test_anonymous_data_access_is_denied(query):
    result = await _run(query)
    assert result.data is None
    assert result.errors
    assert result.errors[0].extensions.get("code") == "UNAUTHENTICATED"


@pytest.mark.asyncio
async def test_anonymous_introspection_is_allowed():
    result = await _run("{ __typename }")
    assert result.errors is None
    assert result.data == {"__typename": "Query"}


@pytest.mark.asyncio
async def test_authenticated_access_is_allowed():
    result = await _run("{ secret }", user=object())
    assert result.errors is None
    assert result.data == {"secret": "TOP-SECRET"}
