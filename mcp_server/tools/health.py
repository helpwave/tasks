from __future__ import annotations

from mcp_server.graphql_client import GraphQLResponseError
from mcp_server.tooling import tool_error


def register_health_tool(app, client) -> None:
    @app.tool()
    @tool_error("health")
    async def health() -> dict:
        try:
            await client.execute("query Health { __typename }")
            return {"status": "ok"}
        except GraphQLResponseError as exc:
            return {"status": "error", "errors": exc.errors}
