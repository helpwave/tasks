pkgs:

let
  inherit (pkgs) writeShellApplication;
  pythonEnv = import ../packages/python-env.nix { python3 = pkgs.python313; };

  start-docker = writeShellApplication {
    name = "start-docker";
    runtimeInputs = [ pkgs.docker-compose ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"
      echo ">>> Starting PostgreSQL, Redis, Keycloak and InfluxDB via Docker..."
      (cd "$PROJECT_ROOT" && docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis keycloak influxdb)
    '';
  };

  stop-docker = writeShellApplication {
    name = "stop-docker";
    runtimeInputs = [ pkgs.docker-compose ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"
      echo ">>> Stopping PostgreSQL, Redis, Keycloak and InfluxDB..."
      (cd "$PROJECT_ROOT" && docker-compose -f "$DOCKER_COMPOSE_FILE" down)
    '';
  };

  clean-dev = writeShellApplication {
    name = "clean-dev";
    runtimeInputs = [ pkgs.docker-compose ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"
      echo ">>> Stopping and removing containers and volumes..."
      (cd "$PROJECT_ROOT" && docker-compose -f "$DOCKER_COMPOSE_FILE" down -v)
      echo ">>> Cleaned environment."
    '';
  };

  run-dev-backend = writeShellApplication {
    name = "run-dev-backend";
    runtimeInputs = [
      pkgs.docker-compose
      pythonEnv
    ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"
      docker-compose -f "$DOCKER_COMPOSE_FILE" stop backend || true
      cd "$PROJECT_ROOT/backend"
      exec uvicorn main:app --reload
    '';
  };

  run-dev-web = writeShellApplication {
    name = "run-dev-web";
    runtimeInputs = [
      pkgs.docker-compose
      pkgs.nodejs_22
    ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"
      docker-compose -f "$DOCKER_COMPOSE_FILE" stop web || true
      cd "$PROJECT_ROOT/web"
      if [ ! -d node_modules ]; then
        echo ">>> web/node_modules missing — run: (cd web && npm ci)"
        exit 1
      fi
      exec npm run dev
    '';
  };

  run-alembic = writeShellApplication {
    name = "run-alembic";
    runtimeInputs = [ pythonEnv ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      cd "$PROJECT_ROOT/backend"
      exec alembic "$@"
    '';
  };

  run-alembic-upgrade = writeShellApplication {
    name = "run-alembic-upgrade";
    runtimeInputs = [
      pkgs.netcat-gnu
      pythonEnv
    ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      port="''${POSTGRES_PORT:-5432}"
      while ! nc -z localhost "$port"; do
        echo ">>> Waiting for database on :$port..."
        sleep 0.5
      done
      sleep 1
      echo ">>> Database is up!"
      cd "$PROJECT_ROOT/backend"
      exec alembic upgrade head
    '';
  };

  psql-dev = writeShellApplication {
    name = "psql-dev";
    runtimeInputs = [ pkgs.postgresql_15 ];
    text = ''
      export PGPASSWORD="''${POSTGRES_PASSWORD:-password}"
      exec psql \
        -h "''${POSTGRES_HOST:-localhost}" \
        -U "''${POSTGRES_USER:-postgres}" \
        -d "''${POSTGRES_DATABASE:-postgres}" \
        -p "''${POSTGRES_PORT:-5432}" \
        "$@"
    '';
  };

  redis-cli-dev = writeShellApplication {
    name = "redis-cli-dev";
    runtimeInputs = [ pkgs.redis ];
    text = ''
      exec redis-cli \
        -h "''${REDIS_HOST:-localhost}" \
        -p "''${REDIS_PORT:-6379}" \
        "$@"
    '';
  };

  run-simulator = writeShellApplication {
    name = "run-simulator";
    runtimeInputs = [
      (pkgs.python313.withPackages (
        ps: with ps; [
          python-dotenv
          requests
        ]
      ))
    ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      cd "$PROJECT_ROOT/simulator"
      export KEYCLOAK_URL="''${KEYCLOAK_URL:-http://localhost:8080}"
      export API_URL="''${API_URL:-http://localhost:8000/graphql}"
      export REALM="''${REALM:-tasks}"
      export USE_DIRECT_GRANT="''${USE_DIRECT_GRANT:-true}"
      export CLIENT_ID="''${CLIENT_ID:-tasks-web}"
      export USERNAME="''${USERNAME:-test}"
      export PASSWORD="''${PASSWORD:-test}"
      exec python main.py "$@"
    '';
  };

  lint-dockerfiles = writeShellApplication {
    name = "lint-dockerfiles";
    runtimeInputs = [ pkgs.hadolint ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      echo ">>> Linting all Dockerfiles with hadolint..."
      hadolint --failure-threshold warning \
        "$PROJECT_ROOT/backend/Dockerfile" \
        "$PROJECT_ROOT/simulator/Dockerfile" \
        "$PROJECT_ROOT/web/Dockerfile" \
        "$PROJECT_ROOT/proxy/Dockerfile"
    '';
  };

  lint-python = writeShellApplication {
    name = "lint-python";
    runtimeInputs = [ pkgs.ruff ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      echo ">>> Ruff: backend"
      ruff check "$PROJECT_ROOT/backend" --output-format=concise --exclude database/migrations
      echo ">>> Ruff: simulator"
      ruff check "$PROJECT_ROOT/simulator" --output-format=concise
    '';
  };

  run-act = writeShellApplication {
    name = "run-act";
    runtimeInputs = [ pkgs.act ];
    text = ''
      echo ">>> Running GitHub Actions locally with act..."
      exec act "$@"
    '';
  };

  run-dev-all = writeShellApplication {
    name = "run-dev-all";
    runtimeInputs = [
      pkgs.docker-compose
      pkgs.bash
      pkgs.coreutils
      pkgs.findutils
      start-docker
      stop-docker
      run-alembic-upgrade
      pythonEnv
      pkgs.nodejs_22
    ];
    text = ''
      : "''${PROJECT_ROOT:?PROJECT_ROOT is not set}"
      : "''${DOCKER_COMPOSE_FILE:?DOCKER_COMPOSE_FILE is not set}"

      docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services \
        | grep -vE "keycloak|postgres|redis|influxdb" \
        | xargs -r docker-compose -f "$DOCKER_COMPOSE_FILE" stop || true

      start-docker
      trap 'echo ">>> Stopping all dev services..."; stop-docker; exit' INT TERM

      run-alembic-upgrade

      if [ ! -d "$PROJECT_ROOT/web/node_modules" ]; then
        echo ">>> web/node_modules missing — run: (cd web && npm ci)"
        exit 1
      fi

      (
        cd "$PROJECT_ROOT/backend"
        exec uvicorn main:app --reload
      ) &
      backend_pid=$!

      (
        cd "$PROJECT_ROOT/web"
        exec npm run dev
      ) &
      web_pid=$!

      wait "$backend_pid" "$web_pid"
      stop-docker
    '';
  };
in
[
  start-docker
  stop-docker
  clean-dev
  run-dev-backend
  run-dev-web
  run-dev-all
  run-alembic
  run-alembic-upgrade
  psql-dev
  redis-cli-dev
  run-simulator
  lint-dockerfiles
  lint-python
  run-act
]
