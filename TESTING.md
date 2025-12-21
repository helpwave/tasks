# Testing Guide

This document describes how to run tests for all components of the tasks project.

## Quick Test Commands

### Backend Tests
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest tests/unit -v
pytest tests/integration -v
pytest tests/ -v  # Run all tests
```

### Frontend Linting
```bash
cd web
npm install
npm run lint
```

### E2E Tests
```bash
cd tests
npm install
npx playwright install chromium
npx playwright test
```

### All Linting
```bash
# Backend
cd backend
ruff check .

# Simulator
cd simulator
ruff check .

# Frontend
cd web
npm run lint
```

## Running GitHub Actions Locally

Use [act](https://github.com/nektos/act) to run GitHub Actions workflows locally.

### Installation

**macOS:**
```bash
brew install act
```

**Linux:**
```bash
# Download from https://github.com/nektos/act/releases
# Or use package manager if available
```

**Prerequisites:**
- Docker must be installed and running

### Usage

```bash
# List all workflows
act -l

# Run all workflows
act

# Run specific workflow file
act -W .github/workflows/tests.yml

# Run specific job
act -j backend-tests
act -j frontend-tests
act -j e2e-tests

# Run on specific event
act push
act pull_request
```

### Troubleshooting

- If Docker images fail: `act --pull=false`
- For verbose output: `act -v`
- To use secrets: Create `.secrets` file and use `act --secret-file .secrets`

See [.github/workflows/README.md](.github/workflows/README.md) for more details.

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/tests.yml`) runs:

1. **Backend Tests** - Unit and integration tests across Python 3.11, 3.12, 3.13
2. **Frontend Tests** - TypeScript type checking and ESLint
3. **E2E Tests** - Playwright end-to-end tests

All tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

## Test Structure

```
backend/
  tests/
    unit/          # Unit tests for services and utilities
    integration/    # Integration tests for resolvers
    conftest.py     # Shared test fixtures

tests/
  e2e/             # End-to-end Playwright tests
    *.spec.ts      # Test specifications
    playwright.config.ts
  package.json     # E2E test dependencies
```

## Fixing Common Issues

### npm ci Error (EUSAGE)

If you see `npm ci` errors about lock file sync:
```bash
cd web  # or tests
rm -rf node_modules package-lock.json
npm install
```

### Playwright Browser Not Found

```bash
cd tests
npx playwright install chromium
```

### Python Module Not Found

Ensure you're in a virtual environment with dependencies installed:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

