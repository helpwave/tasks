# Saved views (persistent views)

## Concept

A **SavedView** stores a named configuration for list screens:

| Field | Purpose |
|--------|---------|
| `filterDefinition` | JSON string: column filters (same wire format as `useStorageSyncedTableState` filters). |
| `sortDefinition` | JSON string: TanStack `SortingState` array. |
| `parameters` | JSON string: **scope** and cross-entity context — `rootLocationIds`, `locationId`, `searchQuery` (patient), `assigneeId` (task / my tasks). |
| `baseEntityType` | `PATIENT` or `TASK` — primary tab when opening `/view/:uid`. |
| `visibility` | `PRIVATE` or `LINK_SHARED` (share by link / UID). |

Location is **not** a separate route anymore for saved views: it is encoded in `parameters` (`rootLocationIds`, `locationId`).

## Cross-entity model

- **Patient view**  
  - **Patients tab**: `PatientList` hydrated from `filterDefinition` / `sortDefinition` / parameters.  
  - **Tasks tab**: `PatientViewTasksPanel` runs the **same patient query** (`usePatients` with identical filters/sort/scope) and flattens tasks from those patients — the task universe is *derived from the patient universe*, not an ad-hoc client filter.

- **Task view**  
  - **Tasks tab**: `useTasksPaginated` with filters from the view + scope from parameters (`rootLocationIds`, `assigneeId`).  
  - **Patients tab**: `TaskViewPatientsPanel` runs **`useTasks` without pagination** with the same task filters/sort/scope and builds **distinct patients** from `tasks[].patient`.

## GraphQL (examples)

```graphql
query {
  savedView(id: "…") {
    id
    name
    baseEntityType
    filterDefinition
    sortDefinition
    parameters
    isOwner
    visibility
  }
}

mutation {
  createSavedView(data: {
    name: "ICU patients"
    baseEntityType: PATIENT
    filterDefinition: "[]"
    sortDefinition: "[]"
    parameters: "{\"rootLocationIds\":[\"…\"],\"locationId\":null,\"searchQuery\":\"\"}"
    visibility: PRIVATE
  }) { id }
}
```

```graphql
mutation {
  duplicateSavedView(id: "…", name: "Copy of shared view") { id }
}
```

## Frontend entry points

| Area | Path / component |
|------|-------------------|
| Open view | `/view/[uid]` |
| Save from patients | `PatientList` → `SaveViewDialog` |
| Save from my tasks | `/tasks` → `SaveViewDialog` |
| Sidebar | `Page` → expandable **Saved views** + link to settings |
| Manage | `/settings/views` (table: open, rename, share link, duplicate, delete) |

## Migrations

Apply Alembic migration `add_saved_views_table` (or your project’s revision chain) so the `saved_views` table exists before using the API.

## Follow-ups

- **Update view** from UI (owner edits in place → `updateSavedView`) instead of only “save as new”.
- **Share visibility** UI (`LINK_SHARED`) and server checks are already modeled; expose in settings.
- **Redirect** `/location/[id]` → a default view or keep both during transition.
