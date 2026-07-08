# E2E Testing Guide

There are two e2e setups:

1. **Mock-based tests** (most specs under `tests/e2e/`): run the real Next.js
   frontend and stub the GraphQL/OIDC network boundary. Fast, deterministic,
   no backend required.
2. **Proxied full-stack tests** (`tests/e2e/proxy-fullstack.spec.ts`): run the
   production-like docker-compose stack — nginx proxy in front of web, backend
   and Keycloak — built from the current commit's Docker images. These catch
   routing issues (`/graphql`, `/keycloak/...`, `/auth/callback`) and verify
   filtering/sorting against the real query engine.

## Running the Proxied Full-Stack Tests

1. **Build the images for your commit** (or use published ones):
   ```bash
   docker build -t local/tasks-backend:e2e backend
   docker build -t local/tasks-web:e2e web
   docker build -t local/tasks-proxy:e2e proxy
   ```

2. **Start the stack** (ephemeral, no persistent volumes):
   ```bash
   BACKEND_IMAGE=local/tasks-backend:e2e \
   WEB_IMAGE=local/tasks-web:e2e \
   PROXY_IMAGE=local/tasks-proxy:e2e \
   docker compose -f docker-compose.e2e.yml up -d
   ```

3. **Wait for readiness** (Keycloak realm import takes a while):
   ```bash
   curl -fs http://localhost/keycloak/realms/tasks/.well-known/openid-configuration
   curl -fs http://localhost/
   ```

4. **Run the tests against the proxy**:
   ```bash
   cd tests
   E2E_PROXY_TARGET=1 E2E_BASE_URL=http://localhost npx playwright test e2e/proxy-fullstack.spec.ts
   ```

The `E2E_PROXY_TARGET=1` gate keeps these tests skipped during the mock-based
runs. In CI the `e2e-proxy` job (`.github/workflows/tests.yml`) performs these
steps automatically, rebuilding the commit's images from the shared Buildx
cache of the Docker Build workflow.

## Running E2E Tests Locally

### Prerequisites

1. **Start Docker services** (PostgreSQL and Redis):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

2. **Start the backend server**:
   ```bash
   cd backend
   source test_env/bin/activate  # or your virtual environment
   DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/postgres" \
   REDIS_URL="redis://localhost:6379" \
   ENV="test" \
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Start the frontend server**:
   ```bash
   cd web
   npm run build  # if not already built
   NEXT_PUBLIC_API_URL="http://localhost:8000/graphql" npm start
   ```

4. **Wait for servers to be ready**:
   - Backend: `http://localhost:8000/health` should return `{"status": "ok"}`
   - Frontend: `http://localhost:3000` should return HTTP 200

### Running Tests

```bash
cd tests
E2E_BASE_URL="http://localhost:3000" CI=true npx playwright test
```

## NixOS Limitation

**Note for NixOS users**: Playwright's Chromium browser cannot run directly on NixOS due to dynamic linking limitations. The error message will indicate:
```
NixOS cannot run dynamically linked executables intended for generic
linux environments out of the box.
```

**Solutions for NixOS**:
1. Use GitHub Actions to run E2E tests (recommended)
2. Use a Docker container to run the tests
3. Configure NixOS with proper FHS (Filesystem Hierarchy Standard) support

The tests are designed to work correctly on GitHub Actions (Ubuntu runners).

## GitHub Actions

E2E tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The main workflow (`tests.yml`) includes proper E2E test setup with dependency installation.
