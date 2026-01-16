from __future__ import annotations

import argparse
import json
import os
from typing import Any

import anyio
import mcp.types as types
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from openai import AsyncOpenAI


def build_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for key in ("MCP_GRAPHQL_URL", "MCP_ACCESS_TOKEN", "MCP_ACCESS_TOKEN_FILE", "MCP_TIMEOUT_SECONDS"):
        value = os.getenv(key)
        if value:
            env[key] = value
    return env


def tool_schema(tool: types.Tool) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.inputSchema or {"type": "object", "properties": {}},
        },
    }


async def call_tool(
    session: ClientSession,
    name: str,
    arguments: dict[str, Any] | None,
) -> dict[str, Any]:
    result = await session.send_request(
        types.ClientRequest(
            types.CallToolRequest(
                params=types.CallToolRequestParams(
                    name=name,
                    arguments=arguments or {},
                )
            )
        ),
        types.CallToolResult,
    )
    if result.structuredContent is not None:
        return result.structuredContent
    return {"content": [block.model_dump(mode="json") for block in result.content]}


async def run(prompt: str, system: str | None, model: str) -> None:
    params = StdioServerParameters(
        command="python",
        args=["-m", "mcp_server.server"],
        env=build_env(),
        cwd=os.getcwd(),
    )
    async with stdio_client(params) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()
            tools_result = await session.send_request(
                types.ClientRequest(types.ListToolsRequest()),
                types.ListToolsResult,
            )
            tools = [tool_schema(tool) for tool in tools_result.tools]
            client = AsyncOpenAI()

            messages: list[dict[str, Any]] = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            while True:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                )
                message = response.choices[0].message
                messages.append(message.model_dump())
                tool_calls = message.tool_calls or []
                if not tool_calls:
                    print(message.content or "")
                    return
                for call in tool_calls:
                    tool_name = call.function.name
                    tool_args = json.loads(call.function.arguments or "{}")
                    tool_result = await call_tool(session, tool_name, tool_args)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": call.id,
                            "content": json.dumps(tool_result),
                        }
                    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--system", default=None)
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
    parser.add_argument("--provider", default=os.getenv("LLM_PROVIDER", "openai"))
    parser.add_argument(
        "--base-url",
        default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.provider == "ollama":
        os.environ.setdefault("OPENAI_API_KEY", "ollama")
        os.environ.setdefault("OPENAI_BASE_URL", args.base_url)
    anyio.run(run, args.prompt, args.system, args.model, backend="trio")


if __name__ == "__main__":
    main()
