# helpwave tasks

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

### Option B: Automated Setup (Nix)
Use this to let Nix handle dependencies, environment variables, and helper commands automatically.

1.  **Enter Shell**
    ```bash
    nix-shell
    ```

2.  **Start Everything**
    ```bash
    run-dev-all
    ```

3.  **Run Simulator** (Optional)
    ```bash
    run-simulator
    ```

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

## Docker Images

All components are containerized and available on GitHub Container Registry:
- `ghcr.io/helpwave/tasks-backend:latest`
- `ghcr.io/helpwave/tasks-web:latest`
- `ghcr.io/helpwave/tasks-simulator:latest`
- `ghcr.io/helpwave/tasks-proxy:latest`
