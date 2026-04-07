"""Decorators and helpers for MCP tools: error handling and wrapping."""

from __future__ import annotations

from functools import wraps

from mcp_server.graphql_client import GraphQLResponseError


def tool_error(name: str):
    """Decorator that wraps an async tool and converts GraphQLResponseError and other exceptions into RuntimeError with a message prefixed by the tool name. Re-raises RuntimeError unchanged so MCP can report it."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except RuntimeError:
                raise
            except GraphQLResponseError as exc:
                raise RuntimeError(f"{name} failed: {exc}") from exc
            except Exception as exc:
                raise RuntimeError(f"{name} failed: {exc}") from exc

        return wrapper

    return decorator
