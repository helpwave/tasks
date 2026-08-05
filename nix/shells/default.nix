{ ... }:
{
  perSystem =
    {
      pkgs,
      self',
      ...
    }:
    let
      pythonEnv = import ../packages/python-env.nix { python3 = pkgs.python313; };
      helpers = import ./helpers.nix pkgs;
    in
    {
      devShells.default = pkgs.mkShell {
        name = "helpwave-tasks";

        packages = [
          pythonEnv
          pkgs.ruff
          pkgs.nodejs_22
          pkgs.docker
          pkgs.docker-compose
          pkgs.postgresql_15
          pkgs.redis
          pkgs.netcat-gnu
          pkgs.gcc
          pkgs.hadolint
          pkgs.act
          pkgs.git
          pkgs.nixfmt
        ]
        ++ helpers
        ++ [
          self'.packages.backend
          self'.packages.simulator
        ];

        shellHook = ''
          export PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
          export DOCKER_COMPOSE_FILE="''${DOCKER_COMPOSE_FILE:-$PROJECT_ROOT/docker-compose.dev.yml}"

          export ENV="''${ENV:-development}"
          export POSTGRES_USER="''${POSTGRES_USER:-postgres}"
          export POSTGRES_PASSWORD="''${POSTGRES_PASSWORD:-password}"
          export POSTGRES_DATABASE="''${POSTGRES_DATABASE:-postgres}"
          export POSTGRES_HOST="''${POSTGRES_HOST:-localhost}"
          export POSTGRES_PORT="''${POSTGRES_PORT:-5432}"
          export DATABASE_URL="''${DATABASE_URL:-postgresql+asyncpg://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DATABASE}"

          export REDIS_HOST="''${REDIS_HOST:-localhost}"
          export REDIS_PORT="''${REDIS_PORT:-6379}"
          export REDIS_PASSWORD="''${REDIS_PASSWORD:-password}"
          export REDIS_URL="''${REDIS_URL:-redis://:$REDIS_PASSWORD@$REDIS_HOST:$REDIS_PORT}"

          export ISSUER_URI="''${ISSUER_URI:-http://localhost:8080/realms/tasks}"
          export CLIENT_SECRET="''${CLIENT_SECRET:-tasks-secret}"
          export SCAFFOLD_DIRECTORY="''${SCAFFOLD_DIRECTORY:-$PROJECT_ROOT/scaffold}"

          export INFLUXDB_URL="''${INFLUXDB_URL:-http://localhost:8086}"
          export INFLUXDB_TOKEN="''${INFLUXDB_TOKEN:-tasks-token-secret}"
          export INFLUXDB_ORG="''${INFLUXDB_ORG:-tasks}"
          export INFLUXDB_BUCKET="''${INFLUXDB_BUCKET:-audit}"

          echo ">>> helpwave tasks dev shell (side-effect free)"
          echo ">>> Commands: run-dev-backend, run-dev-web, run-dev-all, run-alembic,"
          echo ">>>           psql-dev, redis-cli-dev, start-docker, stop-docker,"
          echo ">>>           clean-dev, run-simulator, lint-python, lint-dockerfiles, run-act"
          echo ">>> Frontend: run '(cd web && npm ci)' once if node_modules is missing."
        '';
      };
    };
}
