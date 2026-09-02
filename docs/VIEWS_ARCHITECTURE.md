# Saved views (persistent views)

## Concept

A **SavedView** stores a named configuration for list screens:

| Field | Purpose |
|--------|---------|
| `filterDefinition` | JSON string: column filters (same wire format as `useStorageSyncedTableState` filters). |
| `sortDefinition` | JSON string: TanStack `SortingState` array. |
| `parameters` | JSON string: **scope** and cross-entity context — `rootLocationIds`, `locationId`, `searchQuery` (patient), `assigneeId` (task / my tasks). |
| `baseEntityType` | `PATIENT` or `TASK` — primary tab when opening `/view/:uid`. |
| `visibility` | `PRIVATE` (owner only, no location needed) or `PUBLIC` (stored at a scaffold node via `locationId`). |
| `locationId` | Scaffold node a `PUBLIC` view is stored at. Everyone who can reach that node sees the view: users whose selected root location lies on the node's path (ancestor or descendant). |

Location is **not** a separate route anymore for saved views: it is encoded in `parameters` (`rootLocationIds`, `locationId`).

## Scoping to a scaffold node

Saved views, task presets and property definitions share the same scoping model (`ScopeVisibility`):

- **Private** (default): only the owner sees the entry. No scaffold node is required.
- **Public**: the entry is stored at a scaffold node (`locationId`). It is visible to everyone who can access that node and whose selected root location lies on the node's path, i.e. the node itself, its subtree and its ancestors. Storing an entry at the root makes it visible to everyone.

List queries (`mySavedViews`, `taskPresets`, `propertyDefinitions`) accept `rootLocationIds`; the web client passes the currently selected root locations so lists follow the app node selection. Editing stays with the owner (views, presets) or with users who can access the node (property definitions).

Migration `add_scope_visibility` makes existing property definitions public on the root node and turns existing saved views and presets private.

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
    visibility: PUBLIC
    locationId: "…"
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
- **Redirect** `/location/[id]` → a default view or keep both during transition.
