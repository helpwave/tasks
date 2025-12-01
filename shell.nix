{
  pkgs ? import <nixpkgs> { },
  postgresUser ? "postgres",
  postgresPassword ? "password",
  postgresDatabase ? "postgres",
  postgresPort ? 5432,
  postgresVersion ? 15,
  redisHost ? "localhost",
  redisPort ? 6379,
  redisPassword ? "password",
  dockerComposeFile ? "docker-compose.dev.yml",
}:

let
  python = pkgs.python313;
  nodejs = pkgs.nodejs_22;

  postgresql = pkgs."postgresql_${toString postgresVersion}";
  redis = pkgs.redis;
  dockerCompose = pkgs.docker-compose;
  netcat = pkgs.netcat-gnu;

  libPath = pkgs.lib.makeLibraryPath [
    pkgs.stdenv.cc.cc.lib
    pkgs.zlib
    pkgs.glib
  ];
in
pkgs.mkShell {
  buildInputs = [
    python
    python.pkgs.pip
    python.pkgs.virtualenv
    nodejs
    pkgs.docker
    dockerCompose
    postgresql
    redis
    netcat
    pkgs.gcc
  ];

  venvDir = "./backend/venv";

  shellHook = ''
    export PROJECT_ROOT="$(pwd)"
    export DOCKER_COMPOSE_FILE="$PROJECT_ROOT/${dockerComposeFile}"

    export ENV=development
    export DATABASE_URL="postgresql+asyncpg://${postgresUser}:${postgresPassword}@localhost:${toString postgresPort}/${postgresDatabase}"
    export REDIS_URL="redis://:${redisPassword}@${redisHost}:${toString redisPort}"
    export ISSUER_URI="http://localhost:8080/realms/tasks"
    export CLIENT_SECRET="tasks-secret"

    export LD_LIBRARY_PATH="${libPath}:$LD_LIBRARY_PATH"

    echo ">>> Activating dev shell..."

    if [ ! -d "$PROJECT_ROOT/$venvDir" ]; then
      ${python}/bin/python -m venv "$PROJECT_ROOT/$venvDir"
    fi
    source "$PROJECT_ROOT/$venvDir/bin/activate"

    if [ -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
      req_file="$PROJECT_ROOT/backend/requirements.txt"
      req_hash_file="$PROJECT_ROOT/$venvDir/.requirements_hash"
      current_hash=$(sha256sum "$req_file" | cut -d " " -f1)
      
      if [ ! -f "$req_hash_file" ] || [ "$(cat "$req_hash_file")" != "$current_hash" ]; then
        echo ">>> Requirements changed. Updating pip..."
        pip install --upgrade pip > /dev/null
        pip install -r "$req_file"
        echo "$current_hash" > "$req_hash_file"
      fi
    fi

    if [ -d "$PROJECT_ROOT/web" ]; then
      if [ ! -d "$PROJECT_ROOT/web/node_modules" ]; then
        (cd "$PROJECT_ROOT/web" && ${nodejs}/bin/npm install)
      fi
    fi

    start-docker() {
      echo ">>> Starting PostgreSQL, Redis and Keycloak via Docker..."
      (cd "$PROJECT_ROOT" && ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres redis keycloak)
    }

    stop-docker() {
      echo ">>> Stopping PostgreSQL, Redis and Keycloak..."
      (cd "$PROJECT_ROOT" && ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE down)
    }

    clean-dev() {
      echo ">>> Stopping and removing containers and volumes..."
      (cd "$PROJECT_ROOT" && ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE down -v)
      echo ">>> Cleaned environment."
    }

    run-dev-backend() {
      ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE stop backend
      (cd "$PROJECT_ROOT/backend" && exec uvicorn main:app --reload)
    }

    run-dev-web() {
      ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE stop web
      (cd "$PROJECT_ROOT/web" && exec ${nodejs}/bin/npm run dev)
    }

    run-alembic() {
      (cd "$PROJECT_ROOT/backend" && alembic "$@")
    }

    run-alembic-upgrade() {
      while ! ${netcat}/bin/nc -z localhost ${toString postgresPort}; do
        echo ">>> Waiting for database on :${toString postgresPort}...";
        sleep 0.5;
      done
      echo ">>> Database is up!"
      run-alembic upgrade head
    }

    psql-dev() {
      PGPASSWORD="${postgresPassword}" ${postgresql}/bin/psql \
        -h localhost \
        -U "${postgresUser}" \
        -d "${postgresDatabase}" \
        -p ${toString postgresPort}
    }

    redis-cli-dev() {
       ${redis}/bin/redis-cli \
        -h "${redisHost}" \
        -p ${toString redisPort}
    }

    run-dev-all() {
      ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE ps --services | grep -vE "keycloak|postgres|redis" | xargs ${dockerCompose}/bin/docker-compose -f $DOCKER_COMPOSE_FILE stop
      start-docker
      trap "echo '>>> Stopping all dev services...'; stop-docker; exit" SIGINT

      run-alembic-upgrade
      
      bash -c '
        trap "exit" SIGINT
        (cd "$PROJECT_ROOT/backend" && exec uvicorn main:app --reload) &
        backend_pid=$!
        (cd "$PROJECT_ROOT/web" && exec ${nodejs}/bin/npm run dev) &
        web_pid=$!
        wait $backend_pid $web_pid
      '
      stop-docker
    }

    echo ">>> Environment ready."
    echo "Commands: run-dev-backend, run-dev-web, run-dev-all, run-alembic, psql-dev, redis-cli-dev, clean-dev"
  '';
}
