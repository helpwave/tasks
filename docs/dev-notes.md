# Developer notes

Conventions, patterns, and how to extend.

## Conventions

- **No comments**: Code should be self-explanatory; avoid self-explanatory comments.
- **Clean code**: Clear naming, explicit typing, modern syntax, consistent spacing.
- **Atomic components**: Small, reusable pieces; parameters sliced so they can be reused.
- **Utils**: Shared logic lives in `web/utils/` (e.g. `date`, `dueDate`, `priority`, `propertyColumn`); add new helpers there or in a new util file as needed.

## Patterns

- **Composition over inheritance**: Prefer composing small hooks and components rather than deep class hierarchies.
- **Shared hooks**: Table state and property column visibility are centralized in `useTableState` and `usePropertyColumnVisibility`; paginated lists use `usePaginatedEntityQuery`.
- **Backend helpers**: `get_property_field_types` for Total resolvers; `subscribe_with_location_filter` for location-scoped subscriptions; `raise_forbidden()` for 403 responses.

## Commands

After changing GraphQL or translations, run:

- **GraphQL**: `npm run generate-graphql` (in `web/`) after editing `*.graphql` files.
- **Translations**: `npm run build-intl` (in `web/`) after editing `*.arb` files.

## How to extend

### New entity (e.g. “Resource”)

1. **Backend**: Add model in `database/models/`, migration, type in `api/types/`, inputs in `api/inputs.py`, resolvers in `api/resolvers/`. Use `BaseMutationResolver` and notification helpers; add `get_property_field_types` in any Total resolver that filters/sorts by property columns.
2. **Web**: Add GraphQL operations in `web/api/`, run `generate-graphql`. Add data hooks (e.g. `useResources`, `useResourcesPaginated` if needed) and any table/detail components. Use `useTableState` and `usePropertyColumnVisibility` for tables with property columns.

### New table with filters/sort/pagination

1. Use `useTableState(prefix)` for persisted state.
2. Use `usePropertyColumnVisibility` if the table has dynamic property columns.
3. Use `getPropertyColumnsForEntity` for property column definitions.
4. For server-paginated data, use `usePaginatedEntityQuery` or a wrapper like `usePatientsPaginated`.

### New subscription with location filter

1. Backend: Expose a subscription that gets a base iterator (e.g. `BaseSubscriptionResolver.entity_updated(info, "entity_name", entity_id)`) and passes it to `subscribe_with_location_filter(..., info.context.db, root_location_ids_str, entity_belongs_to_root_locations)`.
2. Ensure an `entity_belongs_to_root_locations`-style function exists for the entity (or reuse patient/task logic if the entity is tied to them).

### Adding queries and mutations (web)

See [web/docs/adding-queries-and-mutations.md](../web/docs/adding-queries-and-mutations.md) for the workflow (GraphQL doc, codegen, hooks).
