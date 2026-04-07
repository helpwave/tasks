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

The sparkles button in the header opens a drawer where users store an **API key and model in the browser** (localStorage). Each message is proxied through the Next.js route `/api/assistant/chat`, which calls the provider’s **streaming** `chat/completions` API and forwards tokens to the UI as they arrive.

### Local testing

1. Run the stack you normally use for development (backend GraphQL, Keycloak, and this app).
2. Open `http://localhost:3000`, sign in (for example user `test` / `test` on the dev realm).
3. Click the **sparkles** icon in the top bar (left of Feedback).
4. In **Model & API key**:
   - **OpenAI:** leave **API base URL** empty, set **Model** to something you have access to (for example `gpt-4o-mini`), paste your **API key**, and click **Save**.
   - **Ollama (local):** run `ollama serve`, pull a model (`ollama pull llama3.1`), set **API base URL** to `http://localhost:11434/v1`, **Model** to that tag (for example `llama3.1`), and set **API key** to any non-empty placeholder if your setup requires a Bearer token (many local setups accept a dummy value).
5. Choose a **conversation focus** (required), optionally tap a **suggested prompt**, then **Send**. The assistant reply should grow word-by-word as tokens stream in.

Optional on the **Next.js process** (not in `.env.local` for the browser): `ASSISTANT_MAX_OUTPUT_TOKENS` caps the model’s completion length (default `2048`, clamped between 256 and 8192 in the API route).

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
