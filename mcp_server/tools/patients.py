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
    @app.tool()
    @tool_error("get_patient")
    async def get_patient(patient_id: str) -> dict[str, Any] | None:
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
        variables: dict[str, Any] = {
            "locationId": location_id,
            "rootLocationIds": root_location_ids,
            "states": states,
            "limit": limit,
            "offset": offset,
        }
        data = await client.execute(LIST_PATIENTS_QUERY, variables)
        return data.get("patients") or []

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
        patients = await list_patients(limit=limit, offset=offset)
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
        result = await client.execute(CREATE_PATIENT_MUTATION, {"data": data})
        return result.get("createPatient")

    @app.tool()
    @tool_error("update_patient")
    async def update_patient(patient_id: str, data: dict[str, Any]) -> dict[str, Any]:
        result = await client.execute(
            UPDATE_PATIENT_MUTATION, {"id": patient_id, "data": data}
        )
        return result.get("updatePatient")

    @app.tool()
    @tool_error("delete_patient")
    async def delete_patient(patient_id: str) -> bool:
        result = await client.execute(DELETE_PATIENT_MUTATION, {"id": patient_id})
        return bool(result.get("deletePatient"))
