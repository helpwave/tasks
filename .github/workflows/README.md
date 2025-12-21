# Running GitHub Actions Locally

This project uses GitHub Actions for CI/CD. You can run these workflows locally using [act](https://github.com/nektos/act), which simulates GitHub Actions in a Docker environment.

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

