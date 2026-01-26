# E2E Testing Guide

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
