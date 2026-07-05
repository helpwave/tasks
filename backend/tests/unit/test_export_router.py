from database.session import get_db_session
from fastapi.testclient import TestClient
from main import app

VALID_BODY = {
    "format": "csv",
    "columns": [{"key": "title", "label": "Titel"}],
}


async def _no_db_session():
    yield None


def make_client() -> TestClient:
    app.dependency_overrides[get_db_session] = _no_db_session
    return TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_export_requires_authentication():
    client = make_client()
    response = client.post("/export/tasks", json=VALID_BODY)
    assert response.status_code == 401


def test_export_rejects_unknown_entity():
    client = make_client()
    response = client.post("/export/rooms", json=VALID_BODY)
    assert response.status_code == 422


def test_export_rejects_unknown_format():
    client = make_client()
    response = client.post(
        "/export/tasks",
        json={"format": "pdf", "columns": [{"key": "title", "label": "T"}]},
    )
    assert response.status_code == 422


def test_export_requires_columns():
    client = make_client()
    response = client.post(
        "/export/patients",
        json={"format": "csv", "columns": []},
    )
    assert response.status_code == 422
