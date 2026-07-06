# Table exports (CSV / XLSX)

## Why

List screens use virtualized infinite scrolling, so the browser only ever
renders a window of rows. Printing the DOM therefore breaks down for large
lists. Instead, every table view can be exported server-side as **CSV** (raw
data, development friendly) or **XLSX** (a styled, print-ready ward list) that
always contains the *complete* result set of the current view — not just the
rows that happen to be rendered.

## Architecture

```
TaskList / PatientList (web)
  └─ TableExportMenu ── POST {backend}/export/{tasks|patients}
                          └─ routers/export.py  (auth via get_context)
                               └─ api/export/service.py
                                    ├─ reuses TaskQuery.tasks / PatientQuery.patients
                                    │  (same visibility, filters, sorts, search as the UI)
                                    ├─ api/export/cells.py    (value formatting)
                                    └─ api/export/render.py   (CSV / XLSX)
```

The frontend sends exactly what the table currently shows:

- **columns** – the visible columns in their user-defined order, each as
  `{ key, label }`. Labels are the already-localized column headers, so the
  backend never needs UI translations for headers.
- **filters / sorts / search** – the same wire format the GraphQL list
  queries use (`QueryFilterClauseInput`, `QuerySortClauseInput`,
  `QuerySearchInput`), produced by `web/utils/tableStateToApi.ts`.
- **scope** – the list-specific query variables (`rootLocationIds`,
  `assigneeId`, `locationNodeId`, `states`, …), so exports honour the same
  location scoping and saved-view parameters as the list itself.
- **locale / timezone** – from the active UI locale and the configured app
  timezone (default `Europe/Berlin`).

The backend authenticates the request with the same Keycloak bearer token
used for GraphQL (`get_context`), rebuilds the identical list query through
the existing resolvers (including the authorization CTEs and the unified
filter/sort/search engine) and runs it **without UI pagination**, capped at
`EXPORT_MAX_ROWS` (env var, default `10000`).

## Formatting rules

Implemented in `backend/api/export/cells.py` / `render.py`:

- Timestamps are stored UTC-naive; they are converted to the requested
  timezone and formatted per locale (`de-*` → `DD.MM.YYYY HH:MM`, otherwise
  ISO). In XLSX they are written as real date cells with a number format, so
  sorting/filtering keeps working in Excel.
- Date-only due dates (stored as the UTC `23:59:59.999` sentinel, see
  `web/utils/dueDate.ts`) keep their calendar date and are rendered without a
  time component.
- Enums (patient state, sex) and booleans are rendered as localized labels
  (`de` and `en` label sets, `en` fallback for other locales).
- Aggregated cells replicate the UI: patient name, assignee names (team
  fallback), clinic/position titles, ward/room/bed columns derived from the
  position's ancestor chain, task progress (`closed/total`), birthdate with
  age, patient update date (max of patient and task updates), and dynamic
  `property_*` columns for all field types.
- Select and multi-select property values are stored as
  `<definitionId>-opt-<index>` keys; the export resolves them to the
  definition's option labels exactly like `PropertyCell.tsx`, joining
  multi-select values inline with `, `.
- CSV is `;`-separated, CRLF, UTF-8 with BOM — opens correctly in German
  Excel. Decimal numbers use a comma for `de-*` locales.
- Text cells starting with `=`, `+`, `-`, `@` are apostrophe-prefixed to
  prevent CSV/formula injection.

## XLSX print template

The XLSX renderer produces a ward list that prints well without any manual
setup: title + generation block (timestamp, timezone, **exporting user** and
row count — repeated in the print footer), styled header row, zebra striping,
column widths estimated from content, row heights scaled to wrapped content
(minimum 22pt), freeze pane below the header, auto-filter, A4 **landscape by
default**, fit-to-width scaling, the header row repeated on every printed
page, and a footer with generation info and page numbers.

## Frontend integration

- `web/utils/tableExport.ts` – request building, column collection
  (visibility + order + localized labels) and the download trigger.
- `web/components/tables/TableExportMenu.tsx` – the export dropdown (Excel /
  CSV) shown next to the column switcher.
- `PatientList` builds its export request itself (it owns its query state);
  `TaskList` receives the page-level scope via the `exportScope` /
  `exportTitle` props (used by `/tasks` and `/view/[uid]`).
- The patient detail's tasks tab (`PatientTasksView`) exports the patient's
  todo list with a fixed column set, scoped via `patientId`.

## Testing

- `backend/tests/unit/test_export.py` – formatting, localization, timezone
  and sentinel handling, CSV/XLSX rendering, end-to-end service runs against
  the in-memory DB fixtures.
- `backend/tests/unit/test_export_router.py` – auth and payload validation.
- `web/utils/tableExport.test.ts` – column collection and endpoint
  derivation.
