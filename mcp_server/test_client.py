from __future__ import annotations

import argparse
import json
import os
from typing import Any

import anyio
import mcp.types as types
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client


def build_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for key in ("MCP_GRAPHQL_URL", "MCP_ACCESS_TOKEN", "MCP_TIMEOUT_SECONDS"):
        value = os.getenv(key)
        if value:
            env[key] = value
    return env


async def run(list_tools: bool, call: str | None, args: dict[str, Any]) -> None:
    params = StdioServerParameters(
        command="python",
        args=["-m", "mcp_server.server"],
        env=build_env(),
        cwd=os.getcwd(),
    )
    async with stdio_client(params) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()
            if list_tools:
                result = await session.send_request(
                    types.ClientRequest(types.ListToolsRequest()),
                    types.ListToolsResult,
                )
                tool_names = [tool.name for tool in result.tools]
                print(json.dumps(tool_names, indent=2))
            if call:
                result = await session.send_request(
                    types.ClientRequest(
                        types.CallToolRequest(
                            params=types.CallToolRequestParams(
                                name=call,
                                arguments=args,
                            )
                        )
                    ),
                    types.CallToolResult,
                )
                if result.structuredContent is not None:
                    print(json.dumps(result.structuredContent, indent=2))
                else:
                    content = [block.model_dump(mode="json") for block in result.content]
                    print(json.dumps(content, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list-tools", action="store_true")
    parser.add_argument("--call")
    parser.add_argument("--args", default="{}")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    list_tools = args.list_tools or not args.call
    call_args = json.loads(args.args) if args.args else {}
    anyio.run(run, list_tools, args.call, call_args, backend="trio")


if __name__ == "__main__":
    main()
