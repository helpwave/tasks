from typing import Any

import strawberry


@strawberry.type
class TaskGraphNodeType:
    id: str
    title: str
    description: str | None
    priority: str | None
    estimated_time: int | None


@strawberry.type
class TaskGraphEdgeType:
    from_id: str
    to_id: str


@strawberry.type
class TaskGraphType:
    nodes: list[TaskGraphNodeType]
    edges: list[TaskGraphEdgeType]


def task_graph_type_from_dict(graph: dict[str, Any]) -> TaskGraphType:
    nodes_raw = graph.get("nodes") or []
    edges_raw = graph.get("edges") or []
    nodes: list[TaskGraphNodeType] = []
    for n in nodes_raw:
        if not isinstance(n, dict):
            continue
        nodes.append(
            TaskGraphNodeType(
                id=str(n.get("id", "")),
                title=str(n.get("title", "")),
                description=n.get("description") if isinstance(n.get("description"), str) else None,
                priority=n.get("priority") if isinstance(n.get("priority"), str) else None,
                estimated_time=n.get("estimated_time") if isinstance(n.get("estimated_time"), int) else None,
            ),
        )
    edges: list[TaskGraphEdgeType] = []
    for e in edges_raw:
        if not isinstance(e, dict):
            continue
        edges.append(
            TaskGraphEdgeType(
                from_id=str(e.get("from", "")),
                to_id=str(e.get("to", "")),
            ),
        )
    return TaskGraphType(nodes=nodes, edges=edges)


@strawberry.type
class TaskPresetType:
    id: strawberry.ID
    name: str
    key: str
    scope: str
    owner_user_id: strawberry.ID | None
    _graph_json: strawberry.Private[dict[str, Any]]

    @strawberry.field
    def graph(self) -> TaskGraphType:
        return task_graph_type_from_dict(self._graph_json)


def task_preset_type_from_model(p: Any) -> TaskPresetType:
    return TaskPresetType(
        id=p.id,
        name=p.name,
        key=p.key,
        scope=p.scope,
        owner_user_id=p.owner_user_id,
        _graph_json=p.graph_json,
    )
