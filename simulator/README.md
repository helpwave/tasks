# Simulator

This tool simulates clinic traffic for the helpwave tasks application. It authenticates with Keycloak using the `tasks-web` client and performs random actions on the GraphQL API.

**⚠️ DEVELOPMENT USE ONLY**
This script is designed solely for development and testing environments to mimic user behavior on the tasks application. Do not run this against production environments.

## Features

- **Authentication**: Implements OpenID Connect Authorization Code flow with a local callback server.
- **Initial Population**: Automatically creates a hospital structure (Clinic, Wards, Rooms, Beds) and patients if the database is empty.
- **Traffic Simulation**:
  - Creates new patients.
  - Creates tasks with random due dates assigned to patients.
  - Randomly assigns tasks to the logged-in user.
  - Updates task statuses (Done/Reopened).
  - Moves patients between locations.
  - Discharges (deletes) patients.

## Prerequisites

- Python 3.10+
- The `helpwave tasks` stack (Backend, Keycloak, Postgres) must be running.
