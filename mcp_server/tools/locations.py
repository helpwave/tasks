"""MCP tools for locations: clinics and related lookups."""

from __future__ import annotations

from typing import Any

from mcp_server.queries import FIND_CLINICS_BY_NAME_QUERY, LIST_CLINICS_QUERY
from mcp_server.tooling import tool_error

_CLINIC_PAGE_CAP = 100
_CLINIC_PAGE_DEFAULT = 50


def _clinic_pagination(limit: int | None, offset: int | None) -> dict[str, Any]:
    raw = limit if limit is not None else _CLINIC_PAGE_DEFAULT
    page_size = max(1, min(raw, _CLINIC_PAGE_CAP))
    return {
        "limit": page_size,
        "offset": offset if offset is not None else 0,
    }


def register_location_tools(app, client) -> None:
    """Register location-related MCP tools on the given app."""

    @app.tool()
    @tool_error("list_clinics")
    async def list_clinics(
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        """List all clinic location nodes the current user can access, ordered by title. Returns {id, title, kind, parentId}; use id as clinicId. Paginate with limit (default 50, max 100) and offset."""
        variables = _clinic_pagination(limit, offset)
        data = await client.execute(LIST_CLINICS_QUERY, variables)
        return data.get("locationNodes") or []

    @app.tool()
    @tool_error("find_clinic_by_name")
    async def find_clinic_by_name(
        name: str,
        limit: int | None = 50,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        """Resolve clinic location nodes by title. The API matches case-insensitively on substrings of the clinic name. Returns a list of {id, title, kind, parentId}; use id as clinicId when creating patients. Empty name returns an error."""
        trimmed = (name or "").strip()
        if not trimmed:
            raise RuntimeError("find_clinic_by_name failed: name must be non-empty")
        variables: dict[str, Any] = {
            "search": trimmed,
            **_clinic_pagination(limit, offset),
        }
        data = await client.execute(FIND_CLINICS_BY_NAME_QUERY, variables)
        return data.get("locationNodes") or []
