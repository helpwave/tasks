# MCP Integration Plan

## Purpose

Create an MCP server for the helpwave tasks codebase with read/write access to patients and tasks, using the existing backend GraphQL API for all data access and permissions.

## Codebase Facts (Backend)

- GraphQL API at `/graphql` (FastAPI + Strawberry)
- Auth via OIDC access token; enforced in GraphQL resolvers
- Core entities: `Patient`, `Task`, `LocationNode`, `PropertyDefinition`, `PropertyValue`, `User`
- Scheduling and priority already exist on `Task`: `due_date`, `priority`, `estimated_time`
- Patient state transitions and task assignments are exposed as mutations

## Data Model Highlights

- `Patient` has location relationships (clinic, position, assigned locations, teams) and soft-delete via `deleted`
- `Task` links to `Patient`, can be assigned to user or team, supports dependency links
- Properties are stored in `PropertyDefinition` + `PropertyValue` tables for patients and tasks

## GraphQL Surface (Existing Operations)

- Queries: patient(s), task(s), recent patients/tasks
- Mutations: create/update/delete patient and task, assign/unassign, complete/reopen, patient state changes
- Properties: set via `properties` input in create/update

## MCP Server Scope (Initial)

- Read tools: `get_patient`, `list_patients`, `get_task`, `list_tasks`
- Search tools: `search_patients`, `search_tasks`
- Write tools: `create_patient`, `update_patient`, `delete_patient`
- Task tools: `create_task`, `update_task`, `delete_task`, `assign_task`, `assign_task_to_team`, `complete_task`, `reopen_task`
- Scheduling helper: `schedule_task` (wraps update with `due_date`, `priority`, `estimated_time`)
- Summary tools: `summarize_patient_tasks`, `summarize_tasks`

## Architecture Notes

- MCP server should call GraphQL API only (no direct DB access)
- Auth should forward user access tokens when available; otherwise use a service account with restricted orgs
- Keep error mapping: GraphQL `FORBIDDEN` and `BAD_REQUEST` map to MCP tool errors
- Use `checksum` fields on update mutations to prevent overwrites
- Search and filter are applied in the MCP server after fetching lists

## MCP Service Configuration

- `MCP_GRAPHQL_URL` default `http://localhost:8000/graphql`
- `MCP_ACCESS_TOKEN` optional bearer token for GraphQL requests
- `MCP_ACCESS_TOKEN_FILE` optional path to a file containing the token
- `MCP_TIMEOUT_SECONDS` default `15`

## Run Locally

1. `pip install -r mcp_server/requirements.txt`
2. `ENV=development ALLOW_UNAUTHENTICATED_ACCESS=true MCP_GRAPHQL_URL=http://localhost:8000/graphql python -m mcp_server.server`

## Run With LLM

1. `export OPENAI_API_KEY=...`
2. `ENV=development ALLOW_UNAUTHENTICATED_ACCESS=true MCP_GRAPHQL_URL=http://localhost:8000/graphql python mcp_server/llm_runner.py --prompt "Summarize tasks for patient X"`
3. Optional: `OPENAI_MODEL=gpt-4o-mini`

### Ollama

1. Start Ollama locally
2. `LLM_PROVIDER=ollama OLLAMA_BASE_URL=http://localhost:11434/v1 OPENAI_MODEL=llama3.1 ENV=development ALLOW_UNAUTHENTICATED_ACCESS=true MCP_GRAPHQL_URL=http://localhost:8000/graphql python mcp_server/llm_runner.py --prompt "Summarize tasks for patient X"`

## Nix Integration

- `shell.nix` installs `mcp_server/requirements.txt` into the backend venv with a hash check

## Implementation Status

- Initial MCP server scaffold under `mcp_server/`
- GraphQL client with async HTTP calls
- Core read/write tools for patients and tasks
- Scheduling helper and summary tool

## Testing Without Frontend

1. Start backend and dependencies, then log in to get a valid access token
2. Run the MCP server pointing at the backend GraphQL endpoint
3. Use the MCP Inspector UI to call tools and verify read/write behaviors
4. Use GraphQL IDE or curl to cross-check results directly against `/graphql`

Inspector command:

- `ENV=development ALLOW_UNAUTHENTICATED_ACCESS=true MCP_GRAPHQL_URL=http://localhost:8000/graphql mcp dev mcp_server/server.py:app`
- Direct GraphQL calls: `curl` with `Authorization: Bearer <token>` against `/graphql`

Validation checklist:

- Can read patient/task lists limited by access permissions
- Can create patient/task, then read them back
- Can update fields like priority and due date, then verify
- Can delete and confirm soft-delete on patients

## Planned Work Steps

1. Create `mcp_server/` service scaffolding with config for GraphQL endpoint and auth
2. Implement a small GraphQL client layer with typed inputs/outputs
3. Add initial read tools, then write tools
4. Add summary tool with minimal data input and deterministic prompt template
5. Add tests for permission boundaries and write operations
