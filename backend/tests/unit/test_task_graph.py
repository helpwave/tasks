import pytest
from graphql import GraphQLError

from api.services.task_graph import validate_task_graph_dict


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
