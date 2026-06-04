from dataclasses import dataclass

import pytest
from graphql import GraphQLError

from api.services.task_graph import (
    graph_dict_from_preset_inputs,
    validate_task_graph_dict,
)


def test_validate_empty_nodes_raises() -> None:
    with pytest.raises(GraphQLError):
        validate_task_graph_dict({"nodes": [], "edges": []})


def test_validate_cycle_raises() -> None:
    with pytest.raises(GraphQLError) as exc:
        validate_task_graph_dict(
            {
                "nodes": [
                    {"id": "a", "title": "A"},
                    {"id": "b", "title": "B"},
                ],
                "edges": [
                    {"from": "a", "to": "b"},
                    {"from": "b", "to": "a"},
                ],
            },
        )
    assert "cycle" in str(exc.value).lower()


def test_validate_self_edge_raises() -> None:
    with pytest.raises(GraphQLError):
        validate_task_graph_dict(
            {
                "nodes": [{"id": "a", "title": "A"}],
                "edges": [{"from": "a", "to": "a"}],
            },
        )


def test_validate_linear_ok() -> None:
    validate_task_graph_dict(
        {
            "nodes": [
                {"id": "a", "title": "A"},
                {"id": "b", "title": "B"},
            ],
            "edges": [{"from": "a", "to": "b"}],
        },
    )


def test_validate_duplicate_node_id_raises() -> None:
    with pytest.raises(GraphQLError, match="Duplicate node id"):
        validate_task_graph_dict(
            {
                "nodes": [
                    {"id": "a", "title": "A"},
                    {"id": "a", "title": "B"},
                ],
                "edges": [],
            },
        )


def test_validate_node_without_title_raises() -> None:
    with pytest.raises(GraphQLError, match="non-empty title"):
        validate_task_graph_dict(
            {"nodes": [{"id": "a", "title": ""}], "edges": []},
        )


def test_validate_edge_referencing_unknown_node_raises() -> None:
    with pytest.raises(GraphQLError, match="unknown node id"):
        validate_task_graph_dict(
            {
                "nodes": [{"id": "a", "title": "A"}],
                "edges": [{"from": "a", "to": "missing"}],
            },
        )


def test_validate_edges_must_be_a_list() -> None:
    with pytest.raises(GraphQLError, match="edges must be a list"):
        validate_task_graph_dict(
            {"nodes": [{"id": "a", "title": "A"}], "edges": {}},
        )


@dataclass
class _PresetNode:
    node_id: str
    title: str
    description: str | None = None
    priority: object | None = None
    estimated_time: int | None = None


@dataclass
class _PresetEdge:
    from_node_id: str
    to_node_id: str


class _Priority:
    def __init__(self, value: str) -> None:
        self.value = value


def test_graph_dict_from_preset_inputs_maps_nodes_and_edges() -> None:
    nodes = [
        _PresetNode("a", "A", description="first", priority=_Priority("P1"), estimated_time=30),
        _PresetNode("b", "B"),
    ]
    edges = [_PresetEdge("a", "b")]

    graph = graph_dict_from_preset_inputs(nodes, edges)

    assert graph == {
        "nodes": [
            {
                "id": "a",
                "title": "A",
                "description": "first",
                "priority": "P1",
                "estimated_time": 30,
            },
            {
                "id": "b",
                "title": "B",
                "description": None,
                "priority": None,
                "estimated_time": None,
            },
        ],
        "edges": [{"from": "a", "to": "b"}],
    }


def test_graph_dict_from_preset_inputs_result_passes_validation() -> None:
    nodes = [_PresetNode("a", "A"), _PresetNode("b", "B")]
    edges = [_PresetEdge("a", "b")]
    validate_task_graph_dict(graph_dict_from_preset_inputs(nodes, edges))
