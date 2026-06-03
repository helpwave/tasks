from datetime import datetime, timezone

from api.context import Context, get_context
from database.session import get_db_session
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from jinja2 import Environment, select_autoescape
from pydantic import BaseModel, Field

router = APIRouter()

_MAX_ROWS = 5000
_MAX_COLUMNS = 40

_jinja_env = Environment(autoescape=select_autoescape(["html", "xml"]))

_TABLE_TEMPLATE = _jinja_env.from_string(
    """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page {
    size: A4 {{ orientation }};
    margin: 1.4cm 1.2cm 1.6cm 1.2cm;
    @bottom-center {
      content: "{{ page_label }} " counter(page) " / " counter(pages);
      font-size: 8pt;
      color: #6b7280;
    }
    @bottom-right {
      content: "{{ generated_label }} {{ generated_at }}";
      font-size: 8pt;
      color: #6b7280;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1f2933;
    font-size: 9pt;
    margin: 0;
  }
  header { margin-bottom: 0.6cm; }
  .brand { color: #2563eb; font-size: 8pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { font-size: 16pt; margin: 2px 0 2px 0; }
  .subtitle { color: #4b5563; font-size: 10pt; margin: 0 0 6px 0; }
  .meta { color: #4b5563; font-size: 8.5pt; margin-top: 4px; }
  .meta span { margin-right: 14px; }
  .meta b { color: #1f2933; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    text-align: left;
    background: #f3f4f6;
    color: #374151;
    font-weight: 700;
    border-bottom: 1px solid #d1d5db;
    padding: 5px 7px;
    font-size: 8.5pt;
  }
  td {
    border-bottom: 1px solid #e5e7eb;
    padding: 4px 7px;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  tbody tr:nth-child(even) { background: #fafafa; }
  .empty { color: #6b7280; font-style: italic; padding: 12px 0; }
</style>
</head>
<body>
  <header>
    <div class="brand">helpwave tasks</div>
    <h1>{{ title }}</h1>
    {% if subtitle %}<div class="subtitle">{{ subtitle }}</div>{% endif %}
    <div class="meta">
      <span><b>{{ rows_label }}:</b> {{ rows|length }}</span>
      {% for key, value in meta.items() %}<span><b>{{ key }}:</b> {{ value }}</span>{% endfor %}
    </div>
  </header>
  {% if rows %}
  <table>
    <thead>
      <tr>{% for column in columns %}<th>{{ column }}</th>{% endfor %}</tr>
    </thead>
    <tbody>
      {% for row in rows %}
      <tr>{% for cell in row %}<td>{{ cell }}</td>{% endfor %}</tr>
      {% endfor %}
    </tbody>
  </table>
  {% else %}
  <div class="empty">{{ empty_label }}</div>
  {% endif %}
</body>
</html>"""
)


class TableExportRequest(BaseModel):
    title: str = Field(..., max_length=200)
    subtitle: str | None = Field(default=None, max_length=400)
    columns: list[str]
    rows: list[list[str]]
    orientation: str = "landscape"
    meta: dict[str, str] = Field(default_factory=dict)
    rows_label: str = "Rows"
    empty_label: str = "No entries"
    generated_label: str = "Generated"
    page_label: str = "Page"


def _normalize(request: TableExportRequest) -> TableExportRequest:
    if not request.columns:
        raise HTTPException(status_code=422, detail="At least one column is required")
    if len(request.columns) > _MAX_COLUMNS:
        raise HTTPException(status_code=422, detail="Too many columns")
    if len(request.rows) > _MAX_ROWS:
        raise HTTPException(status_code=422, detail="Too many rows to export")
    orientation = request.orientation if request.orientation in ("portrait", "landscape") else "landscape"
    width = len(request.columns)
    rows: list[list[str]] = []
    for row in request.rows:
        cells = ["" if cell is None else str(cell) for cell in row[:width]]
        cells += [""] * (width - len(cells))
        rows.append(cells)
    return request.model_copy(update={"orientation": orientation, "rows": rows})


def render_table_html(request: TableExportRequest) -> str:
    normalized = _normalize(request)
    return _TABLE_TEMPLATE.render(
        title=normalized.title,
        subtitle=normalized.subtitle,
        columns=normalized.columns,
        rows=normalized.rows,
        orientation=normalized.orientation,
        meta=normalized.meta,
        rows_label=normalized.rows_label,
        empty_label=normalized.empty_label,
        generated_label=normalized.generated_label,
        page_label=normalized.page_label,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )


def render_table_pdf(request: TableExportRequest) -> bytes:
    html = render_table_html(request)
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as exc:  # missing python pkg or native libs
        raise HTTPException(
            status_code=503,
            detail="PDF rendering is not available on this server",
        ) from exc
    return HTML(string=html).write_pdf()


async def _require_context(
    request: Request,
    session=Depends(get_db_session),
) -> Context:
    return await get_context(request, session)


@router.post("/export/table.pdf")
async def export_table_pdf(
    body: TableExportRequest,
    context: Context = Depends(_require_context),
) -> Response:
    if context.user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    pdf = render_table_pdf(body)
    filename = _safe_filename(body.title)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}.pdf"'},
    )


def _safe_filename(title: str) -> str:
    cleaned = "".join(c if c.isalnum() or c in (" ", "-", "_") else "" for c in title).strip()
    cleaned = cleaned.replace(" ", "-").lower()
    return cleaned or "table-export"
