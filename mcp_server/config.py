"""Load MCP server configuration from environment: GraphQL URL, auth token, and timeout."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Immutable config: graphql_url (e.g. http://localhost:8000/graphql), optional access_token for Bearer auth, timeout_seconds for HTTP requests."""

    graphql_url: str
    access_token: str | None
    timeout_seconds: float


def load_settings() -> Settings:
    """Read MCP_GRAPHQL_URL, MCP_ACCESS_TOKEN or MCP_ACCESS_TOKEN_FILE, and MCP_TIMEOUT_SECONDS from the environment and return a Settings instance. Token file takes precedence over MCP_ACCESS_TOKEN if both are set."""
    graphql_url = os.getenv("MCP_GRAPHQL_URL", "http://localhost:8000/graphql")
    access_token_file = os.getenv("MCP_ACCESS_TOKEN_FILE")
    access_token = None
    if access_token_file:
        try:
            with open(access_token_file, "r", encoding="utf-8") as token_file:
                token_value = token_file.read().strip()
                access_token = token_value if token_value else None
        except FileNotFoundError:
            access_token = None
    if access_token is None:
        access_token = os.getenv("MCP_ACCESS_TOKEN")
    timeout_seconds_raw = os.getenv("MCP_TIMEOUT_SECONDS", "15")
    timeout_seconds = float(timeout_seconds_raw)
    return Settings(
        graphql_url=graphql_url,
        access_token=access_token,
        timeout_seconds=timeout_seconds,
    )
