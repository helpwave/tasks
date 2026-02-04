# Project structure

Key folders and their responsibilities.

## Root

| Folder | Responsibility |
|--------|----------------|
| **backend/** | GraphQL API, database, auth, business logic. |
| **web/** | Next.js app: pages, components, data layer, i18n. |
| **simulator/** | Dev tool: creates patients/tasks via GraphQL. |
| **proxy/** | Nginx config for production. |
| **keycloak/** | Realm JSON and docs. |
| **scaffold/** | Seed data for locations/structures. |
| **tests/** | E2E (Playwright), shared test config. |
| **docs/** | Project documentation (this folder). |

## Backend (`backend/`)

| Path | Responsibility |
|------|----------------|
| **api/** | Resolvers, services, decorators, types, inputs. |
| **api/resolvers/** | GraphQL queries/mutations/subscriptions (patient, task, location, property, user, audit). |
| **api/services/** | Authorization, location, property, notifications, subscription (Redis), validation, datetime, checksum. |
| **api/decorators/** | Filter/sort/pagination, full-text search, `get_property_field_types` for Total resolvers. |
| **api/inputs.py** | Strawberry input types. |
| **api/types/** | Strawberry types for DB models. |
| **api/errors.py** | Shared `raise_forbidden()`. |
| **database/** | SQLAlchemy models, migrations (Alembic), session. |
| **auth.py** | JWT validation, user from token. |
| **config.py** | Env-based config. |
| **main.py** | FastAPI app, GraphQL router. |

## Web (`web/`)

| Path | Responsibility |
|------|----------------|
| **components/** | UI: tables (PatientList, TaskList, Recent*), patients, tasks, properties, layout, dialogs. |
| **data/** | Apollo client, cache, hooks (queries/mutations), subscriptions, persistence. |
| **data/hooks/** | `usePatientsPaginated`, `useTasksPaginated`, `usePaginatedEntityQuery`, queryHelpers. |
| **pages/** | Next.js routes and page components. |
| **hooks/** | `useTableState`, `usePropertyColumnVisibility`, auth, pagination, conflict resolution. |
| **utils/** | Date, due-date, priority, property columns, location, table config, GraphQL helpers. |
| **i18n/** | Translation wiring and usage. |
| **locales/** | ARB translation files. |
| **providers/** | Apollo, conflict, subscriptions. |
| **api/** | GraphQL documents and generated types. |

## Simulator (`simulator/`)

| Path | Responsibility |
|------|----------------|
| **main.py** | Entrypoint. |
| **simulator.py** | Orchestration. |
| **patient_manager.py**, **task_manager.py** | Create/update entities via GraphQL. |
| **location_manager.py** | Location tree and assignment. |
| **graphql_client.py** | HTTP GraphQL client. |
