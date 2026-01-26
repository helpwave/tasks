from __future__ import annotations

import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP

if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent.parent))

from mcp_server.config import load_settings
from mcp_server.graphql_client import GraphQLClient
from mcp_server.tools.health import register_health_tool
from mcp_server.tools.patients import register_patient_tools
from mcp_server.tools.tasks import register_task_tools

settings = load_settings()

if settings.dev_mode_no_auth:
    print("WARNING: Running in DEV_MODE_NO_AUTH. Authentication is disabled.", file=sys.stderr)

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
    app.run()


if __name__ == "__main__":
    main()
