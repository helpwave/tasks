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
