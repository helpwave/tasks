"""MCP tools for patients: read, list, search, create, update, and delete."""

from __future__ import annotations

from typing import Any

from mcp_server.filters import filter_patients
from mcp_server.queries import (
    CREATE_PATIENT_MUTATION,
    DELETE_PATIENT_MUTATION,
    GET_PATIENT_QUERY,
    LIST_PATIENTS_QUERY,
    UPDATE_PATIENT_MUTATION,
)
from mcp_server.tooling import tool_error


def register_patient_tools(app, client) -> None:
    """Register all patient-related MCP tools on the given app, using the provided GraphQL client."""

    async def fetch_patients(
        location_id: str | None = None,
        root_location_ids: list[str] | None = None,
        states: list[str] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        variables: dict[str, Any] = {
            "locationNodeId": location_id,
            "rootLocationIds": root_location_ids,
            "states": states,
        }
        if limit is not None or offset is not None:
            page_size = limit if limit is not None else 50
            page_index = (offset or 0) // page_size
            variables["pagination"] = {
                "pageIndex": page_index,
                "pageSize": page_size,
            }
        data = await client.execute(LIST_PATIENTS_QUERY, variables)
        return data.get("patients") or []

    @app.tool()
    @tool_error("get_patient")
    async def get_patient(patient_id: str) -> dict[str, Any] | None:
        """Fetch a single patient by ID. Returns the patient object (id, name, firstname, lastname, birthdate, sex, state, locations, tasks, properties, etc.) or None if not found or forbidden."""
        data = await client.execute(GET_PATIENT_QUERY, {"id": patient_id})
        return data.get("patient")

    @app.tool()
    @tool_error("list_patients")
    async def list_patients(
        location_id: str | None = None,
        root_location_ids: list[str] | None = None,
        states: list[str] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        """List patients from the GraphQL API. Optional filters: location_id (locationNodeId), root_location_ids, states. Use limit/offset for pagination (mapped to pageIndex/pageSize). Returns a list of patient objects."""
        return await fetch_patients(
            location_id=location_id,
            root_location_ids=root_location_ids,
            states=states,
            limit=limit,
            offset=offset,
        )

    @app.tool()
    @tool_error("search_patients")
    async def search_patients(
        name: str | None = None,
        birthdate: str | None = None,
        sex: str | None = None,
        state: str | None = None,
        description: str | None = None,
        property_filters: list[dict[str, Any]] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        """Search patients by fetching a page from the API then filtering in-memory by name, birthdate, sex, state, description, and optional property_filters. Use when you need client-side filtering not supported by the API."""
        patients = await fetch_patients(limit=limit, offset=offset)
        return filter_patients(
            patients,
            name=name,
            birthdate=birthdate,
            sex=sex,
            state=state,
            description=description,
            property_filters=property_filters,
        )

    @app.tool()
    @tool_error("create_patient")
    async def create_patient(data: dict[str, Any]) -> dict[str, Any]:
        """Create a new patient. Data must include firstname, lastname, birthdate, sex, state, clinicId; may include positionId, assignedLocationId, description, properties. Returns the created patient object."""
        result = await client.execute(CREATE_PATIENT_MUTATION, {"data": data})
        return result.get("createPatient")

    @app.tool()
    @tool_error("update_patient")
    async def update_patient(patient_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Update an existing patient by ID. Data can include firstname, lastname, birthdate, sex, state, positionId, assignedLocationId, description, properties; include checksum for optimistic locking. Returns the updated patient."""
        result = await client.execute(
            UPDATE_PATIENT_MUTATION, {"id": patient_id, "data": data}
        )
        return result.get("updatePatient")

    @app.tool()
    @tool_error("delete_patient")
    async def delete_patient(patient_id: str) -> bool:
        """Soft-delete a patient by ID. Returns True if the mutation succeeded."""
        result = await client.execute(DELETE_PATIENT_MUTATION, {"id": patient_id})
        return bool(result.get("deletePatient"))
