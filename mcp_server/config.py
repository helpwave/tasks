from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    graphql_url: str
    access_token: str | None
    timeout_seconds: float
    dev_mode_no_auth: bool


def load_settings() -> Settings:
    graphql_url = os.getenv("MCP_GRAPHQL_URL", "http://localhost:8000/graphql")
    access_token_file = os.getenv("MCP_ACCESS_TOKEN_FILE")
    access_token = None
    
    dev_mode_no_auth = os.getenv("DEV_MODE_NO_AUTH") == "true"

    if access_token_file:
        try:
            with open(access_token_file, "r", encoding="utf-8") as token_file:
                token_value = token_file.read().strip()
                access_token = token_value if token_value else None
        except FileNotFoundError:
            access_token = None
    
    if access_token is None and not dev_mode_no_auth:
        access_token = os.getenv("MCP_ACCESS_TOKEN")
        
    timeout_seconds_raw = os.getenv("MCP_TIMEOUT_SECONDS", "15")
    timeout_seconds = float(timeout_seconds_raw)
    
    return Settings(
        graphql_url=graphql_url,
        access_token=access_token,
        timeout_seconds=timeout_seconds,
        dev_mode_no_auth=dev_mode_no_auth,
    )
