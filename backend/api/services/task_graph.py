from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from api.services.notifications import notify_entity_created, notify_entity_update
from database import models
from graphql import GraphQLError
from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession


def validate_task_graph_dict(graph: dict[str, Any]) -> None:
    nodes_raw = graph.get("nodes")
    edges_raw = graph.get("edges")
    if not isinstance(nodes_raw, list) or len(nodes_raw) == 0:
        raise GraphQLError(
            "Task graph must contain at least one node",
            extensions={"code": "BAD_REQUEST"},
        )
    if not isinstance(edges_raw, list):
        raise GraphQLError(
            "Task graph edges must be a list",
            extensions={"code": "BAD_REQUEST"},
        )
    node_ids: set[str] = set()
    for i, n in enumerate(nodes_raw):
        if not isinstance(n, dict):
            raise GraphQLError(
                f"Invalid node at index {i}",
                extensions={"code": "BAD_REQUEST"},
            )
        nid = n.get("id")
        if not nid or not isinstance(nid, str):
            raise GraphQLError(
                "Each node requires a string id",
                extensions={"code": "BAD_REQUEST"},
            )
        if nid in node_ids:
            raise GraphQLError(
                f"Duplicate node id: {nid}",
                extensions={"code": "BAD_REQUEST"},
            )
        node_ids.add(nid)
        title = n.get("title")
        if not title or not isinstance(title, str):
            raise GraphQLError(
                f"Node {nid} requires a non-empty title",
                extensions={"code": "BAD_REQUEST"},
            )
    for i, e in enumerate(edges_raw):
        if not isinstance(e, dict):
            raise GraphQLError(
                f"Invalid edge at index {i}",
                extensions={"code": "BAD_REQUEST"},
            )
        f_id = e.get("from")
        t_id = e.get("to")
        if not f_id or not t_id:
            raise GraphQLError(
                "Each edge requires from and to node ids",
                extensions={"code": "BAD_REQUEST"},
            )
        if f_id not in node_ids or t_id not in node_ids:
            raise GraphQLError(
                "Edge references unknown node id",
                extensions={"code": "BAD_REQUEST"},
            )
        if f_id == t_id:
            raise GraphQLError(
                "Self-referential task dependency is not allowed",
                extensions={"code": "BAD_REQUEST"},
            )
    _assert_acyclic(node_ids, edges_raw)


def _assert_acyclic(node_ids: set[str], edges_raw: list[dict[str, Any]]) -> None:
    adj: dict[str, list[str]] = defaultdict(list)
    indeg: dict[str, int] = {nid: 0 for nid in node_ids}
    for e in edges_raw:
        f_id = e["from"]
        t_id = e["to"]
        adj[f_id].append(t_id)
        indeg[t_id] += 1
    q = deque([nid for nid in node_ids if indeg[nid] == 0])
    visited = 0
    while q:
        u = q.popleft()
        visited += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if visited != len(node_ids):
        raise GraphQLError(
            "Task graph contains a cycle",
            extensions={"code": "BAD_REQUEST"},
        )


async def insert_task_dependencies(
    db: AsyncSession,
    next_task_id: str,
    previous_task_ids: list[str],
    patient_id: str,
) -> None:
    if not previous_task_ids:
        return
    seen: list[str] = []
    dup: set[str] = set()
    for pid in previous_task_ids:
        if pid in dup:
            continue
        dup.add(pid)
        seen.append(pid)
        if pid == next_task_id:
            raise GraphQLError(
                "Task cannot depend on itself",
                extensions={"code": "BAD_REQUEST"},
            )
        res_prev = await db.execute(
            select(models.Task).where(models.Task.id == pid),
        )
        prev = res_prev.scalars().first()
        if not prev:
            raise GraphQLError(
                "Previous task not found",
                extensions={"code": "BAD_REQUEST"},
            )
        if prev.patient_id != patient_id:
            raise GraphQLError(
                "Previous task must belong to the same patient",
                extensions={"code": "BAD_REQUEST"},
            )
    for pid in seen:
        await db.execute(
            insert(models.task_dependencies).values(
                previous_task_id=pid,
                next_task_id=next_task_id,
            ),
        )


async def replace_incoming_task_dependencies(
    db: AsyncSession,
    next_task_id: str,
    previous_task_ids: list[str] | None,
    patient_id: str,
) -> None:
    if previous_task_ids is None:
        return
    await db.execute(
        delete(models.task_dependencies).where(
            models.task_dependencies.c.next_task_id == next_task_id,
        ),
    )
    await insert_task_dependencies(db, next_task_id, previous_task_ids, patient_id)


def graph_dict_from_preset_inputs(
    nodes: list[Any],
    edges: list[Any],
) -> dict[str, Any]:
    return {
        "nodes": [
            {
                "id": n.node_id,
                "title": n.title,
                "description": n.description,
                "priority": n.priority.value if getattr(n, "priority", None) else None,
                "estimated_time": getattr(n, "estimated_time", None),
            }
            for n in nodes
        ],
        "edges": [
            {"from": e.from_node_id, "to": e.to_node_id} for e in edges
        ],
    }


async def apply_task_graph_to_patient(
    db: AsyncSession,
    patient_id: str,
    graph: dict[str, Any],
    assignee_id: str | None,
    source_task_preset_id: str | None = None,
) -> list[models.Task]:
    validate_task_graph_dict(graph)
    nodes_raw = graph["nodes"]
    edges_raw = graph["edges"]
    assignees: list[models.User] = []
    if assignee_id:
        ur = await db.execute(
            select(models.User).where(models.User.id == assignee_id),
        )
        assignee_user = ur.scalars().first()
        if assignee_user:
            assignees = [assignee_user]
    temp_to_task: dict[str, str] = {}
    created: list[models.Task] = []
    for n in nodes_raw:
        nid = n["id"]
        title = n["title"]
        description = n.get("description")
        priority = n.get("priority")
        estimated_time = n.get("estimated_time")
        task = models.Task(
            title=title,
            description=description if isinstance(description, str) else None,
            patient_id=patient_id,
            source_task_preset_id=source_task_preset_id,
            assignees=assignees,
            assignee_team_id=None,
            due_date=None,
            priority=priority if isinstance(priority, str) else None,
            estimated_time=estimated_time if isinstance(estimated_time, int) else None,
        )
        db.add(task)
        created.append(task)
    await db.flush()
    for n, task in zip(nodes_raw, created, strict=True):
        nid = n["id"]
        tid = task.id
        if not tid:
            raise GraphQLError(
                "Task id was not assigned after insert",
                extensions={"code": "INTERNAL_ERROR"},
            )
        temp_to_task[nid] = tid
    dep_key: set[tuple[str, str]] = set()
    dep_rows: list[dict[str, str]] = []
    for e in edges_raw:
        prev_real = temp_to_task[e["from"]]
        next_real = temp_to_task[e["to"]]
        key = (prev_real, next_real)
        if key in dep_key:
            continue
        dep_key.add(key)
        dep_rows.append(
            {"previous_task_id": prev_real, "next_task_id": next_real},
        )
    for row in dep_rows:
        await db.execute(insert(models.task_dependencies).values(row))
    await db.commit()
    task_ids = [t.id for t in created]
    res = await db.execute(
        select(models.Task).where(models.Task.id.in_(task_ids)),
    )
    tasks = list(res.scalars().all())
    order = {tid: i for i, tid in enumerate(task_ids)}
    tasks.sort(key=lambda t: order.get(t.id, 0))
    for task in tasks:
        await notify_entity_created("task", task.id)
    await notify_entity_update("patient", patient_id)
    return tasks
