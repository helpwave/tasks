from __future__ import annotations

from functools import wraps

from mcp_server.graphql_client import GraphQLResponseError


def tool_error(name: str):
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
