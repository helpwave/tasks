# Backend

The backend is a FastAPI application providing a GraphQL API using Strawberry for the helpwave tasks platform.

## Features

- GraphQL API with Strawberry
- PostgreSQL database with async SQLAlchemy
- Redis for caching and pub/sub
- InfluxDB for audit logging
- Keycloak integration for authentication
- Alembic for database migrations
- Scaffold data loading for initial hospital structure

## Prerequisites

- Python 3.13+
- PostgreSQL 15+
- Redis 8+
- InfluxDB 2.7+
- Keycloak 26+

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/postgres
REDIS_URL=redis://:password@localhost:6379
ENV=development
ISSUER_URI=http://localhost:8080/realms/tasks
PUBLIC_ISSUER_URI=http://localhost:8080/realms/tasks
CLIENT_ID=tasks-backend
CLIENT_SECRET=tasks-secret
SCAFFOLD_DIRECTORY=/scaffold
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=tasks-token-secret
INFLUXDB_ORG=tasks
INFLUXDB_BUCKET=audit

# Optional hardening knobs
ADDITIONAL_ISSUERS=            # extra trusted token issuers (comma-separated)
GRAPHQL_MAX_DEPTH=15           # reject documents deeper than this
GRAPHQL_MAX_ALIASES=50         # reject documents with more aliases than this
GRAPHQL_MAX_TOKENS=2000        # reject documents with more tokens than this
```

## Security model

Authentication and authorization are enforced server-side, deny-by-default:

- **Authentication.** Access tokens are verified with the realm JWKS
  (signature, expiry, trusted issuer, and audience/`azp`). Tokens are read only
  from the `Authorization: Bearer` header (HTTP and WebSocket
  `connection_params`); the `access_token` cookie is honoured in development
  only, and tokens are never read from the query string.
- **GraphQL is locked down.** Anonymous HTTP requests to `/graphql` are
  rejected with `401` in production; the only thing an unauthenticated caller
  may do (in development) is introspection. The GraphiQL IDE, GET queries, and
  schema introspection are disabled outside development. A schema extension
  denies every non-introspection field for an unauthenticated caller, including
  fields wrapped in fragments. Subscriptions require a valid token at connect
  time. Documents are bounded by depth/alias/token limits.
- **Authorization is location-scoped.** Every resolver restricts reads and
  writes to the caller's accessible location subtree (rooted at
  `user_root_locations`). Property definitions and saved views are attached to a
  scaffold location and are only visible/editable inside that scope.

## Development Setup

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start server**:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000/graphql`

## Database Migrations

Migrations are managed using Alembic:

```bash
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "description"
```

If `alembic heads` shows more than one head, run `alembic upgrade head` after pulling so merge revisions are applied. After upgrades that add tables (`task_assignees`, etc.), `alembic upgrade head` must succeed before the API can query those tables.

## Docker

The backend is containerized and available as:

```bash
docker run --rm \
  -e DATABASE_URL=postgresql+asyncpg://postgres:password@postgres:5432/postgres \
  -e REDIS_URL=redis://:password@redis:6379 \
  -e ISSUER_URI=http://keycloak:8080/realms/tasks \
  -e CLIENT_ID=tasks-backend \
  -e CLIENT_SECRET=tasks-secret \
  -e INFLUXDB_URL=http://influxdb:8086 \
  -e INFLUXDB_TOKEN=tasks-token-secret \
  -e INFLUXDB_ORG=tasks \
  -e INFLUXDB_BUCKET=audit \
  ghcr.io/helpwave/tasks-backend:latest
```

## Project Structure

- **api/** - GraphQL API definitions
  - **resolvers/** - GraphQL resolvers
  - **types/** - GraphQL type definitions
  - **inputs.py** - Input types
- **database/** - Database models and migrations
  - **models/** - SQLAlchemy models
  - **migrations/** - Alembic migration scripts
- **main.py** - FastAPI application entry point
- **config.py** - Configuration management
- **auth.py** - Authentication utilities
- **scaffold.py** - Initial data loading

## GraphQL Schema

The API provides the following main types:
- **Patient** - Patient management
- **Task** - Task management
- **LocationNode** - Hospital structure (clinics, wards, teams, rooms, beds)
- **PropertyDefinition** - Custom property definitions
- **User** - User management

## Testing

Run tests with pytest:

```bash
pytest
```

