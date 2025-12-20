# Simulator

This tool simulates clinic traffic for the helpwave tasks application. It authenticates with Keycloak using the `tasks-web` client and performs random actions on the GraphQL API.

**⚠️ DEVELOPMENT USE ONLY**

This script is designed solely for development and testing environments to mimic user behavior on the tasks application. Do not run this against production environments.

## Features

- **Authentication**: Implements OpenID Connect Authorization Code flow with a local callback server.
- **Location Management**: Displays hospital structure and manages location hierarchies.
- **Patient Simulation**:
  - Creates new patients in waiting room or admits them directly.
  - Assigns realistic diagnoses to patients.
  - Moves patients between locations.
  - Updates patient positions (bed assignments).
  - Discharges patients.
- **Task Simulation**:
  - Creates treatment tasks based on patient diagnosis.
  - Assigns tasks to random users with due dates.
  - Updates task statuses (Done/Reopened).
- **Treatment Planning**: Generates realistic treatments based on 10 different diagnosis types.

## Prerequisites

- Python 3.10+
- The `helpwave tasks` stack (Backend, Keycloak, Postgres, InfluxDB) must be running.

## Environment Variables

```bash
KEYCLOAK_URL=http://localhost:8080
API_URL=http://localhost:8000/graphql
REALM=tasks
CLIENT_ID=tasks-web
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=tasks-token-secret
INFLUXDB_ORG=tasks
INFLUXDB_BUCKET=audit
```

## Usage

### Local Development

1. **Using Nix** (Recommended):
   ```bash
   nix-shell
   run-simulator
   ```

2. **Manual Setup**:
   ```bash
   cd simulator
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m simulator
   ```

### Docker

The simulator is available as a Docker image:

```bash
docker run --rm \
  -e KEYCLOAK_URL=http://keycloak:8080 \
  -e API_URL=http://backend:80/graphql \
  -e REALM=tasks \
  -e CLIENT_ID=tasks-web \
  ghcr.io/helpwave/tasks-simulator:latest
```

Or using docker-compose:

```bash
docker-compose -f docker-compose.dev.yml up simulator
```

## Architecture

The simulator is split into multiple modules:

- **simulator.py** - Main orchestrator and simulation loop
- **location_manager.py** - Location structure management and display
- **patient_manager.py** - Patient operations (create, admit, discharge, move)
- **task_manager.py** - Task operations (create, update, assign)
- **treatment_planner.py** - Diagnosis-based treatment planning
- **data.py** - Random data generators
- **graphql_client.py** - GraphQL API client
- **authentication.py** - OAuth2 authentication flow

## How It Works

1. Authenticates with Keycloak using OAuth2 Authorization Code flow
2. Loads current state (locations, patients, tasks, users)
3. Displays the location structure hierarchy
4. Creates initial patients (some in waiting room, some admitted)
5. Continuously performs random actions:
   - Create tasks (25%)
   - Update tasks (20%)
   - Create patients (15%)
   - Admit patients (10%)
   - Move patients (10%)
   - Update positions (8%)
   - Discharge patients (7%)
   - Add teams (5%)

## Diagnosis Types

The simulator supports 10 different diagnosis types with corresponding treatment plans:

- Hypertension
- Diabetes Type 2
- Pneumonia
- Fractured Leg
- Appendicitis
- Heart Attack
- Stroke
- Asthma
- Kidney Infection
- Migraine
