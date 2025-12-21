# Running GitHub Actions Locally

This project uses GitHub Actions for CI/CD. You can run these workflows locally using [act](https://github.com/nektos/act), which simulates GitHub Actions in a Docker environment.

## Workflow Overview

### Main Workflow: `tests.yml` ⭐ **RECOMMENDED**
**Primary workflow for all tests and linting**
- Runs on: `push` and `pull_request` to `main` and `develop`
- Jobs:
  - `backend-lint` - Lints Python backend code
  - `simulator-lint` - Lints Python simulator code
  - `frontend-lint` - Lints TypeScript/JavaScript frontend code
  - `backend-tests` - Runs backend unit and integration tests (Python 3.11, 3.12, 3.13)
  - `frontend-tests` - Runs frontend type checking
  - `e2e-tests` - Runs end-to-end tests with Playwright (includes proper dependency installation)
  - `build` - Builds the frontend application

**Use this workflow for:**
- ✅ Full CI/CD pipeline
- ✅ Comprehensive testing
- ✅ Pull request validation
- ✅ **E2E tests (properly configured with dependencies)**

### Secondary Workflow: `e2e-tests.yml`
**Standalone E2E test workflow (legacy/alternative)**
- Runs on: `push`, `pull_request` to `main` and `develop`, and `workflow_dispatch`
- Single job: `e2e` - Runs only E2E tests

**Use this workflow for:**
- Quick E2E test runs
- Manual E2E testing via workflow_dispatch
- Focused E2E test debugging

**Note:** The main `tests.yml` workflow is **recommended** for most use cases as it includes all tests, linting, and properly configured E2E tests with dependency installation.

## Prerequisites

1. **Docker**: Ensure Docker is installed and running
   ```bash
   docker --version
   ```

2. **Install act**:
   - **macOS**: `brew install act`
   - **Linux**: Download from [act releases](https://github.com/nektos/act/releases)
   - **Windows**: Use WSL or download from releases

## Usage

### List all workflows
```bash
act -l
```

### Run all workflows
```bash
act
```

### Run a specific workflow
```bash
act -W .github/workflows/tests.yml
act -W .github/workflows/e2e-tests.yml
```

### Run a specific job
```bash
act -j backend-tests
act -j frontend-tests
act -j e2e-tests
```

### Run on specific event
```bash
act push
act pull_request
```

### Use secrets (if needed)
Create a `.secrets` file in the repository root:
```
SECRET_NAME=secret_value
```

Then run:
```bash
act --secret-file .secrets
```

## Limitations

- Services (PostgreSQL, Redis) are automatically set up by act
- Some actions may behave differently locally vs. on GitHub
- Large workflows may take longer locally

## Troubleshooting

- If Docker images fail to pull, use `act --pull=false`
- For verbose output: `act -v`
- To use a specific platform: `act --container-architecture linux/amd64`
