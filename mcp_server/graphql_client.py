from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class GraphQLResponseError(Exception):
    message: str
    errors: list[dict[str, Any]]

    def __post_init__(self) -> None:
        error_messages = [
            error.get("message", "Unknown GraphQL error") for error in self.errors
        ]
        formatted = "; ".join(error_messages)
        object.__setattr__(self, "args", (f"{self.message}: {formatted}",))


@dataclass(frozen=True)
class GraphQLClient:
    url: str
    access_token: str | None
    timeout_seconds: float

    async def execute(
        self, query: str, variables: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        payload = {"query": query, "variables": variables or {}}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(self.url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
        if "errors" in data and data["errors"]:
            raise GraphQLResponseError(
                message="GraphQL request failed",
                errors=data["errors"],
            )
        return data.get("data") or {}
