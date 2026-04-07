# MCP Server

The MCP server implementation lives in `mcp_server/`. It exposes helpwave tasks and patients via the Model Context Protocol, using the backend GraphQL API.

## Prerequisites

- Python 3 with dependencies: from the repo root run `pip install -r mcp_server/requirements.txt` in the venv you use (e.g. the backend venv). All listed packages (including `idna`, `anyio`) are required.
- Backend running at the GraphQL URL (e.g. `http://localhost:8000/graphql`) when testing tools that call the API
- Node.js 18+ for the MCP Inspector (optional)

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_GRAPHQL_URL` | Backend GraphQL endpoint | `http://localhost:8000/graphql` |
| `MCP_ACCESS_TOKEN` | Bearer token for GraphQL requests | — |
| `MCP_ACCESS_TOKEN_FILE` | Path to file containing the token | — |
| `MCP_TIMEOUT_SECONDS` | Timeout for GraphQL requests | `15` |
| `MCP_TRANSPORT` | `stdio` (default) or `http` for Streamable HTTP | `stdio` |
| `MCP_HTTP_HOST` / `MCP_HTTP_PORT` | Bind address when `MCP_TRANSPORT=http` | `127.0.0.1` / `8765` |

## Start the MCP server

### stdio (default): Inspector, test client, `llm_runner`

From the **repository root**:

```bash
export MCP_GRAPHQL_URL=http://localhost:8000/graphql
python -m mcp_server.server
```

With the default transport, the server speaks MCP over **stdio**. If you run it directly in a terminal it waits on stdin—use the test client or MCP Inspector (they spawn this process).

### HTTP: in-app assistant (Next.js)

The web app’s **Working** assistant mode connects with the TypeScript MCP client to **Streamable HTTP** at `http://127.0.0.1:8765/mcp` by default (`ASSISTANT_MCP_URL` overrides this on the Next.js side).

From the **repository root**:

```bash
export MCP_GRAPHQL_URL=http://localhost:8000/graphql
export MCP_TRANSPORT=http
python -m mcp_server.server
```

Optional: `MCP_ACCESS_TOKEN` or `MCP_ACCESS_TOKEN_FILE` if your GraphQL API requires a Bearer token.

## Test with the test client

From the repository root, with the same env vars you use for the server:

```bash
export MCP_GRAPHQL_URL=http://localhost:8000/graphql
```

List tools:

```bash
python -m mcp_server.test_client --list-tools
```

Call a tool:

```bash
backend/venv/bin/python -m mcp_server.test_client --call list_tasks --args '{}'
backend/venv/bin/python -m mcp_server.test_client --call get_health --args '{}'
```

If `--call` is omitted, the client only lists tools.

## Test with the MCP Inspector

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is a UI to inspect and call tools, resources, and prompts. It requires Node.js 18+.

1. From the **repository root**, run the Inspector and pass your server command and env:

```bash
npx @modelcontextprotocol/inspector \
  -e MCP_GRAPHQL_URL=http://localhost:8000/graphql \
  backend/venv/bin/python -m mcp_server.server
```

2. Open the URL shown in the terminal (typically `http://localhost:6274`).

3. In the Inspector, choose the **stdio** transport; the command and env are already set. Connect to see tools, then run tools from the **Tools** tab.

To use a token:

```bash
npx @modelcontextprotocol/inspector \
  -e MCP_GRAPHQL_URL=http://localhost:8000/graphql \
  -e MCP_ACCESS_TOKEN="your-token" \
  backend/venv/bin/python -m mcp_server.server
```

For local **nix-shell / docker-compose.dev.yml** setups, Keycloak runs on `http://localhost:8080` (not `http://localhost/keycloak`). Get a token and pass it to Inspector:

```bash
TOKEN_RESPONSE=$(curl -fsS -X POST "http://localhost:8080/realms/tasks/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=tasks-web" \
  -d "username=test" \
  -d "password=test")
TOKEN=$(printf '%s' "$TOKEN_RESPONSE" | backend/venv/bin/python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

npx @modelcontextprotocol/inspector \
  -e MCP_GRAPHQL_URL=http://localhost:8000/graphql \
  -e MCP_ACCESS_TOKEN="$TOKEN" \
  backend/venv/bin/python -m mcp_server.server
```

If you run the production-style `docker-compose.yml` with the proxy on port `80`, the token endpoint is `http://localhost/keycloak/realms/tasks/protocol/openid-connect/token` and GraphQL is `http://localhost/graphql`.

## Run with an LLM (optional)

See `PLAN.md` for `llm_runner.py` usage with OpenAI or Ollama.

## Troubleshooting

- **`ModuleNotFoundError`** (e.g. `idna`, `certifi`) or **`Connection closed`** when using the test client: the MCP server subprocess fails because a dependency is missing. Install (or reinstall) MCP server deps in your active venv from the repo root: `backend/venv/bin/python -m pip install -r mcp_server/requirements.txt`.
- In offline/dev-shell environments, `mcp_server/_vendor/` provides compatibility shims used only when these packages are unavailable.


## Where to get the token
1. Log into tasks
2. Open the developer tools
3. Application -> Local Storage -> localhost -> oidc.user:http://localhost:8080/realms/tasks:tasks-web -> access_token
