from __future__ import annotations

from typing import Any

from mcp_server.filters import filter_tasks
from mcp_server.queries import (
    ASSIGN_TASK_MUTATION,
    ASSIGN_TASK_TO_TEAM_MUTATION,
    COMPLETE_TASK_MUTATION,
    CREATE_TASK_MUTATION,
    DELETE_TASK_MUTATION,
    GET_TASK_QUERY,
    LIST_TASKS_QUERY,
    REOPEN_TASK_MUTATION,
    UPDATE_TASK_MUTATION,
)
from mcp_server.summary import format_summary
from mcp_server.tooling import tool_error


def register_task_tools(app, client) -> None:
    @app.tool()
    @tool_error("get_task")
    async def get_task(task_id: str) -> dict[str, Any] | None:
        data = await client.execute(GET_TASK_QUERY, {"id": task_id})
        return data.get("task")

    @app.tool()
    @tool_error("list_tasks")
    async def list_tasks(
        patient_id: str | None = None,
        assignee_id: str | None = None,
        assignee_team_id: str | None = None,
        root_location_ids: list[str] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        variables: dict[str, Any] = {
            "patientId": patient_id,
            "assigneeId": assignee_id,
            "assigneeTeamId": assignee_team_id,
            "rootLocationIds": root_location_ids,
            "limit": limit,
            "offset": offset,
        }
        data = await client.execute(LIST_TASKS_QUERY, variables)
        return data.get("tasks") or []

    @app.tool()
    @tool_error("search_tasks")
    async def search_tasks(
        patient_name: str | None = None,
        patient_id: str | None = None,
        title_contains: str | None = None,
        description_contains: str | None = None,
        done: bool | None = None,
        priority: str | None = None,
        property_filters: list[dict[str, Any]] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        tasks = await list_tasks(limit=limit, offset=offset)
        return filter_tasks(
            tasks,
            patient_name=patient_name,
            patient_id=patient_id,
            title_contains=title_contains,
            description_contains=description_contains,
            done=done,
            priority=priority,
            property_filters=property_filters,
        )

    @app.tool()
    @tool_error("create_task")
    async def create_task(data: dict[str, Any]) -> dict[str, Any]:
        result = await client.execute(CREATE_TASK_MUTATION, {"data": data})
        return result.get("createTask")

    @app.tool()
    @tool_error("update_task")
    async def update_task(task_id: str, data: dict[str, Any]) -> dict[str, Any]:
        result = await client.execute(
            UPDATE_TASK_MUTATION, {"id": task_id, "data": data}
        )
        return result.get("updateTask")

    @app.tool()
    @tool_error("delete_task")
    async def delete_task(task_id: str) -> bool:
        result = await client.execute(DELETE_TASK_MUTATION, {"id": task_id})
        return bool(result.get("deleteTask"))

    @app.tool()
    @tool_error("assign_task")
    async def assign_task(task_id: str, user_id: str) -> dict[str, Any]:
        result = await client.execute(
            ASSIGN_TASK_MUTATION, {"id": task_id, "userId": user_id}
        )
        return result.get("assignTask")

    @app.tool()
    @tool_error("assign_task_to_team")
    async def assign_task_to_team(task_id: str, team_id: str) -> dict[str, Any]:
        result = await client.execute(
            ASSIGN_TASK_TO_TEAM_MUTATION, {"id": task_id, "teamId": team_id}
        )
        return result.get("assignTaskToTeam")

    @app.tool()
    @tool_error("complete_task")
    async def complete_task(task_id: str) -> dict[str, Any]:
        result = await client.execute(COMPLETE_TASK_MUTATION, {"id": task_id})
        return result.get("completeTask")

    @app.tool()
    @tool_error("reopen_task")
    async def reopen_task(task_id: str) -> dict[str, Any]:
        result = await client.execute(REOPEN_TASK_MUTATION, {"id": task_id})
        return result.get("reopenTask")

    @app.tool()
    @tool_error("schedule_task")
    async def schedule_task(
        task_id: str,
        due_date: str | None = None,
        priority: str | None = None,
        estimated_time: int | None = None,
        checksum: str | None = None,
    ) -> dict[str, Any]:
        data: dict[str, Any] = {
            "dueDate": due_date,
            "priority": priority,
            "estimatedTime": estimated_time,
            "checksum": checksum,
        }
        result = await client.execute(
            UPDATE_TASK_MUTATION, {"id": task_id, "data": data}
        )
        return result.get("updateTask")

    @app.tool()
    @tool_error("summarize_patient_tasks")
    async def summarize_patient_tasks(
        patient_id: str,
        include_done: bool = True,
    ) -> dict[str, Any]:
        tasks = await list_tasks(patient_id=patient_id)
        if not include_done:
            tasks = [task for task in tasks if task.get("done") is False]
        summary = format_summary(tasks)
        return {"patient_id": patient_id, "summary": summary, "tasks": tasks}

    @app.tool()
    @tool_error("summarize_tasks")
    async def summarize_tasks(
        patient_name: str | None = None,
        patient_id: str | None = None,
        title_contains: str | None = None,
        description_contains: str | None = None,
        done: bool | None = None,
        priority: str | None = None,
        property_filters: list[dict[str, Any]] | None = None,
        output_format: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> dict[str, Any]:
        tasks = await search_tasks(
            patient_name=patient_name,
            patient_id=patient_id,
            title_contains=title_contains,
            description_contains=description_contains,
            done=done,
            priority=priority,
            property_filters=property_filters,
            limit=limit,
            offset=offset,
        )
        if output_format == "list":
            items = []
            for task in tasks:
                title = task.get("title") or "Untitled"
                status = "done" if task.get("done") else "open"
                items.append(f"{title} ({status})")
            return {"format": "list", "items": items, "count": len(items)}
        summary = format_summary(tasks)
        return {"format": "summary", "summary": summary, "count": len(tasks)}
