"""MCP server entrypoint: configures FastMCP app, GraphQL client, and registers patient, task, and health tools."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent.parent))

vendor_path = Path(__file__).resolve().parent / "_vendor"
if str(vendor_path) not in sys.path:
    sys.path.insert(0, str(vendor_path))

from fastmcp import FastMCP

from mcp_server.config import load_settings
from mcp_server.graphql_client import GraphQLClient
from mcp_server.tools.health import register_health_tool
from mcp_server.tools.patients import register_patient_tools
from mcp_server.tools.tasks import register_task_tools

settings = load_settings()
client = GraphQLClient(
    url=settings.graphql_url,
    access_token=settings.access_token,
    timeout_seconds=settings.timeout_seconds,
)

app = FastMCP("helpwave-tasks")

register_patient_tools(app, client)
register_task_tools(app, client)
register_health_tool(app, client)


def main() -> None:
    """Run the MCP server on port 8001 with HTTP transport. Requires MCP_GRAPHQL_URL (and optionally MCP_ACCESS_TOKEN or MCP_ACCESS_TOKEN_FILE, MCP_TIMEOUT_SECONDS) to be set or defaults will be used."""
    app.run(port=800, transport="http")


if __name__ == "__main__":
    main()
