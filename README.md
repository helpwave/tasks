# helpwave tasks

[![Tests](https://github.com/helpwave/tasks/actions/workflows/tests.yml/badge.svg)](https://github.com/helpwave/tasks/actions/workflows/tests.yml)
[![License](https://img.shields.io/badge/license-MPL2-blue.svg)](LICENSE)

**helpwave tasks** is a modern, open-source task and ward-management platform tailored for healthcare - designed to bring clarity, efficiency and structure to hospitals, wards and clinical workflows.

## Quick Start

If you simply want to test the application without modifying code, use the production compose file. This pulls official images and runs them behind a reverse proxy.

1.  **Run the Stack**
    ```bash
    docker-compose up -d
    ```

2.  **Access the App**
    * **App URL:** [`http://localhost:80`](http://localhost:80)
    * **User:** `test` / `test`

## Development

This section covers setting up the local environment for coding. You need **PostgreSQL**, **Redis**, **Keycloak**, and **InfluxDB** running to support the backend.

### Environment Configuration

The application relies on the following services. Ensure your environment variables are set:

```bash
DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/postgres"
REDIS_URL="redis://:password@localhost:6379"
ENV=development
INFLUXDB_URL="http://localhost:8086"
INFLUXDB_TOKEN="tasks-token-secret"
INFLUXDB_ORG="tasks"
INFLUXDB_BUCKET="audit"
```

### Option A: Manual Setup (Docker Compose)
Use this if you prefer managing your own Python and Node versions.

1.  **Start Infrastructure**
    Start Postgres, Redis, Keycloak, and InfluxDB:
    ```bash
    docker-compose -f docker-compose.dev.yml up -d postgres redis keycloak influxdb
    ```

2.  **Run Backend**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    alembic upgrade head
    uvicorn main:app --reload
    ```

3.  **Run Frontend**
    In a new terminal:
    ```bash
    cd web
    npm install
    npm run dev
    ```

4.  **Run Simulator** (Optional)
    In a new terminal:
    ```bash
    cd simulator
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python -m simulator
    ```

### Option B: Nix flake

Requires [Nix](https://nixos.org/download/) with flakes enabled. The flake provides pure packages, a side-effect-free `nix develop` shell, and a NixOS module. Infrastructure (Postgres, Redis, Keycloak, InfluxDB) still comes from Docker Compose in the develop shell.

#### Develop

```bash
nix develop
# or from anywhere:
nix develop github:helpwave/tasks
```

First time only for the frontend checkout:

```bash
(cd web && npm ci)
```

Then:

```bash
run-dev-all
# optional:
run-simulator
```

Helpers on `PATH`: `run-dev-backend`, `run-dev-web`, `run-dev-all`, `run-alembic`, `run-alembic-upgrade`, `psql-dev`, `redis-cli-dev`, `start-docker`, `stop-docker`, `clean-dev`, `run-simulator`, `lint-dockerfiles`, `run-act`.

The develop shell does **not** create `venv/` or run `npm install` into the tree.

#### Run / install from GitHub

```bash
nix run github:helpwave/tasks            # usage help
nix run github:helpwave/tasks#backend
nix run github:helpwave/tasks#web
nix run github:helpwave/tasks#simulator
nix run github:helpwave/tasks#proxy

nix profile install github:helpwave/tasks#backend
nix profile install github:helpwave/tasks#web
```

Standalone packages expect configured Postgres, Redis, Keycloak, and InfluxDB (or use the NixOS module below).

#### NixOS module

```nix
{
  inputs.helpwave-tasks.url = "github:helpwave/tasks";

  outputs = { nixpkgs, helpwave-tasks, ... }: {
    nixosConfigurations.example = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        helpwave-tasks.nixosModules.default
        {
          services.helpwave-tasks.enable = true;
          # services.helpwave-tasks.backend.environmentFile = "/run/secrets/tasks.env";
          # services.helpwave-tasks.keycloak.issuerUri = "https://auth.example/realms/tasks";
        }
      ];
    };
  };
}
```

Local Postgres and Redis are enabled by default. Optional InfluxDB 2 and Keycloak can be turned on with `influxdb.createLocally` / `keycloak.createLocally`. Put secrets in `backend.environmentFile`.

### Access & Credentials

Once the development environment is running:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Frontend** | [`http://localhost:3000`](http://localhost:3000) | The user interface (Next.js/React). |
| **Backend API** | [`http://localhost:8000/graphql`](http://localhost:8000/graphql) | The GraphQL Playground (Strawberry). |
| **Keycloak** | [`http://localhost:8080`](http://localhost:8080) | Identity Provider. |
| **InfluxDB** | [`http://localhost:8086`](http://localhost:8086) | Time-series database for audit logs. |

**Keycloak Realms & Users:**
* **tasks Realm:** `http://localhost:8080/realms/tasks` (Redirects automatically from app login)
    * User: `test`
    * Password: `test`
* **master Realm (Admin Console):** [`http://localhost:8080/admin`](http://localhost:8080/admin)
    * User: `admin`
    * Password: `admin`

## Project Structure

- **backend/** - FastAPI backend with GraphQL API (Strawberry)
- **web/** - Next.js frontend application
- **simulator/** - Development tool for simulating clinic traffic
- **proxy/** - Nginx reverse proxy for production deployments
- **keycloak/** - Keycloak realm configuration
- **scaffold/** - Initial data for hospital structure

## Testing

### Running Tests Locally

**Backend Tests:**
```bash
cd backend
python -m pytest tests/unit -v
python -m pytest tests/integration -v
```

**Frontend Linting:**
```bash
cd web
npm run lint
```

**E2E Tests:**
```bash
cd tests
npm install
npx playwright test
```

### Running GitHub Actions Locally

You can run GitHub Actions workflows locally using [act](https://github.com/nektos/act). See [.github/workflows/README.md](.github/workflows/README.md) for detailed instructions.

Quick start:
```bash
# Install act (requires Docker)
brew install act  # macOS
# or download from https://github.com/nektos/act/releases

# Run all workflows
act

# Run specific job
act -j backend-tests
```

## Docker Images

Images are built from Nix (scratch rootfs). GHCR tags on `main`:

- `ghcr.io/helpwave/tasks-backend:latest`
- `ghcr.io/helpwave/tasks-web:latest`
- `ghcr.io/helpwave/tasks-simulator:latest`
- `ghcr.io/helpwave/tasks-proxy:latest`

Build locally via stream:

```bash
nix build .#backend-docker && ./result | docker load
nix build .#web-docker && ./result | docker load
```

Or via two-step Dockerfiles (`nixos/nix` → `scratch`), from the repo root:

```bash
docker build -f backend/Dockerfile -t helpwave-tasks-backend .
docker build -f web/Dockerfile -t helpwave-tasks-web .
docker build -f proxy/Dockerfile -t helpwave-tasks-proxy .
docker build -f simulator/Dockerfile -t helpwave-tasks-simulator .
```
