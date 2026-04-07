# Web Frontend

The web frontend is a Next.js application providing the user interface for the helpwave tasks platform.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## In-app assistant (demo, bring your own key)

The sparkles button opens a drawer where users store an **API key and model** in the browser (localStorage). Requests go to `/api/assistant/chat`.

- **Info** mode: streams tokens from the model (usage / how-to only; no tools).
- **Working** mode: the server loads tools from the **helpwave MCP server** over Streamable HTTP, runs an OpenAI-style tool loop, and returns the final reply as JSON (no token streaming). Default MCP URL is `http://127.0.0.1:8765/mcp`; set **`ASSISTANT_MCP_URL`** in `.env.local` if yours differs.

### Local testing

1. Run the stack you normally use (backend GraphQL, Keycloak, this app). For **Working** mode, also start MCP over HTTP from the **repo root** (see `mcp_server/README.md`):

   `MCP_TRANSPORT=http MCP_GRAPHQL_URL=http://localhost:8000/graphql python -m mcp_server.server`

2. Open the app, sign in (for example `test` / `test`).
3. Click **sparkles** (left of Feedback).
4. In **Model & API key**, configure your provider (OpenAI or OpenAI-compatible such as Ollama) and **Save**.
5. Choose **Info** or **Working**, then **Send**. Info streams; Working waits for the full response after MCP tool rounds.

Optional on the **Next.js process**: `ASSISTANT_MCP_URL`, `ASSISTANT_MAX_OUTPUT_TOKENS` (default `2048`, clamped 256–8192).

**Note:** Some reverse proxies buffer streaming responses. If streaming appears only after the full reply finishes, disable buffering for `/api/assistant/chat` (for example `X-Accel-Buffering: no` is already set on the response; nginx may need `proxy_buffering off` for that location).

## Environment Variables

See `utils/config.ts` for complete configuration options.

Create a file called `.env.local` from the existing `.env.example` file.

At build time and at runtime the correctness of the environment variables is validated, make sure that they are present at each step (even in github actions or similar).

If something is incorrect or missing an error will be thrown.

Required variables:
- `RUNTIME_ISSUER_URI` - Keycloak issuer URI
- `RUNTIME_CLIENT_ID` - OAuth2 client ID
- `RUNTIME_GRAPHQL_ENDPOINT` - GraphQL API endpoint
- `INFLUXDB_URL` - InfluxDB URL for metrics
- `INFLUXDB_TOKEN` - InfluxDB authentication token
- `INFLUXDB_ORG` - InfluxDB organization
- `INFLUXDB_BUCKET` - InfluxDB bucket name

## gRPC-web

To communicate with [`helpwave-services`](https://github.com/helpwave/services) (our gRPC APIs) this projects uses gRPC-web.

## Docker

The web frontend is containerized and available as:

```bash
docker run --rm \
  -e RUNTIME_ISSUER_URI=http://localhost:8080/realms/tasks \
  -e RUNTIME_CLIENT_ID=tasks-web \
  -e RUNTIME_GRAPHQL_ENDPOINT=http://localhost:8000/graphql \
  ghcr.io/helpwave/tasks-web:latest
```

## Build

```bash
npm run build
```

The production build is optimized and can be served statically or via Node.js server.
