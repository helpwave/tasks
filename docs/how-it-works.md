# How it works

Core flows and main abstractions.

## Auth

- Frontend redirects to Keycloak for login; receives JWT.
- Apollo link sends `Authorization: Bearer <token>` on every request.
- Backend `auth.py` validates the token and attaches the user to the request context.
- Resolvers use `info.context.user` and `AuthorizationService` to enforce access.

## Patient and task CRUD

- **Mutations** load the entity, check location access via `AuthorizationService.can_access_patient` (or equivalent), then create/update/delete and call `BaseMutationResolver.create_and_notify` / `update_and_notify` / `delete_entity`.
- **Notifications** publish entity IDs to Redis channels (`patient_created`, `task_updated`, etc.); the web app subscribes and refetches or merges into the cache.
- **Location filtering**: List resolvers (e.g. `patients`, `tasks`) call `get_user_accessible_location_ids` and restrict by clinic/position/assigned locations/teams via CTEs and joins.

## Filter, sort, pagination

- List fields use decorators `@filtered_and_sorted_query()` and `@full_text_search_query()`; they apply `apply_filtering`, `apply_sorting`, and optional full-text search and pagination.
- **Total** resolvers (`patientsTotal`, `tasksTotal`, `recentPatientsTotal`, `recentTasksTotal`) use a shared helper `get_property_field_types(db, filtering, sorting)` so property columns used in filter/sort have the correct field types when joining `PropertyValue`; then they call `apply_filtering` and `apply_sorting` and return a count.

## Subscriptions

- Base subscriptions (`entity_created`, `entity_updated`, `entity_deleted`) subscribe to Redis channels and yield entity IDs.
- **Location filter**: `subscribe_with_location_filter(base_iterator, db, root_location_ids_str, belongs_check)` wraps a base iterator and yields only IDs for which the entity belongs to the given root locations (via `patient_belongs_to_root_locations` or `task_belongs_to_root_locations`). Patient and task subscription resolvers use this so the UI only gets events for the current location scope.

## Frontend: table state and property columns

- **useTableState(storageKeyPrefix)** persists pagination, sorting, filters, and column visibility in `localStorage` with keys `{prefix}-column-*`. Tables (PatientList, TaskList, RecentPatientsTable, RecentTasksTable) use it with prefixes like `patient-list`, `task-list`, `recent-patients`, `recent-tasks`.
- **usePropertyColumnVisibility(propertyDefinitionsData, entity, columnVisibility, setColumnVisibility)** runs a single effect that, when property columns exist but none are in visibility, sets all property columns to hidden so new property definitions don’t clutter the table by default.
- **getPropertyColumnsForEntity(propertyDefinitionsData, entity)** returns column definitions for that entity’s active property definitions; tables use it with `createPropertyColumn`-style columns.

## Frontend: paginated lists

- **usePaginatedEntityQuery** is the generic hook: it takes a GraphQL document, variables, page size, optional `getPageDataKey`, and extractors for items and total count. It keeps a page cache and flattens results for infinite-style pagination.
- **usePatientsPaginated** and **useTasksPaginated** are thin wrappers that pass the right document, variables, extractors, and (for patients) `getPageDataKey` for cache deduplication.
