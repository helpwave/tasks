import pytest
from fastapi import HTTPException
from routers.export import (
    TableExportRequest,
    _normalize,
    _safe_filename,
    render_table_html,
)


def _request(**overrides) -> TableExportRequest:
    base = {
        "title": "My Tasks",
        "columns": ["Title", "Patient"],
        "rows": [["Take blood", "John Doe"], ["Round", "Jane Roe"]],
    }
    base.update(overrides)
    return TableExportRequest(**base)


def test_render_table_html_contains_headers_and_rows():
    html = render_table_html(_request())
    assert "<h1>My Tasks</h1>" in html
    assert "<th>Title</th>" in html
    assert "Take blood" in html
    assert "John Doe" in html
    assert "size: A4 landscape" in html


def test_render_table_html_escapes_cell_content():
    html = render_table_html(_request(rows=[["<script>alert(1)</script>", "x"]]))
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


def test_render_table_html_empty_rows_shows_placeholder():
    html = render_table_html(_request(rows=[], empty_label="Nothing here"))
    assert "Nothing here" in html
    assert "<tbody>" not in html


def test_normalize_pads_and_truncates_rows_to_column_count():
    normalized = _normalize(_request(rows=[["only-one"], ["a", "b", "c-extra"]]))
    assert normalized.rows == [["only-one", ""], ["a", "b"]]


def test_normalize_rejects_empty_columns():
    with pytest.raises(HTTPException) as exc:
        _normalize(_request(columns=[]))
    assert exc.value.status_code == 422


def test_normalize_defaults_invalid_orientation_to_landscape():
    assert _normalize(_request(orientation="sideways")).orientation == "landscape"
    assert _normalize(_request(orientation="portrait")).orientation == "portrait"


def test_safe_filename():
    assert _safe_filename("My Tasks 2026") == "my-tasks-2026"
    assert _safe_filename("///") == "table-export"
