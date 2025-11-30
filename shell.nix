{
  pkgs ? import <nixpkgs> { },
  pgUser ? "user",
  pgPassword ? "password",
  pgDatabase ? "dbname",
  pgVersion ? 15,
  redisVersion ? 7,
}:

let
  python = pkgs.python313;
  nodejs = pkgs.nodejs_22;
  docker = pkgs.docker;
in
pkgs.mkShell {
  buildInputs = [
    python
    python.pkgs.pip
    python.pkgs.virtualenv
    python.pkgs.pip-tools
    python.pkgs.greenlet
    nodejs
    docker
    pkgs.gcc
    pkgs.stdenv.cc.cc.lib
    pkgs."postgresql_${toString pgVersion}"
  ];

  venvDir = "./backend/venv";

  shellHook = ''
    export ENV=development
    export DEBUG=1
    export DATABASE_URL="postgresql+asyncpg://${pgUser}:${pgPassword}@localhost/${pgDatabase}"
    export REDIS_URL="redis://localhost:6379"

    echo ">>> Activating dev shell…"

    if [ ! -d "$venvDir" ]; then
      python -m venv $venvDir
    fi
    source $venvDir/bin/activate

    export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH"

    if [ -f backend/requirements.txt ]; then
      req_hash_file="$venvDir/.requirements_hash"
      current_hash=$(sha256sum backend/requirements.txt | cut -d " " -f1)
      if [ ! -f "$req_hash_file" ] || [ "$(cat $req_hash_file)" != "$current_hash" ]; then
        pip install --upgrade pip > /dev/null
        pip install -r backend/requirements.txt
        echo "$current_hash" > "$req_hash_file"
      fi
    fi

    if [ -d web ]; then
      cd web
      if [ ! -d node_modules ]; then
        npm install
      fi
      cd ..
    fi

    start-docker-db() {
      echo ">>> Starting PostgreSQL and Redis via Docker…"

      docker volume inspect dev-postgres-data >/dev/null 2>&1 || \
        docker volume create dev-postgres-data

      docker run -d --name dev-postgres \
        -e POSTGRES_USER=${pgUser} \
        -e POSTGRES_PASSWORD=${pgPassword} \
        -e POSTGRES_DB=${pgDatabase} \
        -v dev-postgres-data:/var/lib/postgresql/data \
        -p 5432:5432 postgres:${toString pgVersion}

      docker run -d --name dev-redis -p 6379:6379 redis:${toString redisVersion}
    }

    stop-docker-db() {
      echo ">>> Stopping PostgreSQL and Redis…"
      docker rm -f dev-postgres dev-redis 2>/dev/null || true
    }

    run-dev-backend() {
      (cd backend && exec uvicorn main:app --reload)
    }

    run-dev-web() {
      (cd web && exec npm run dev)
    }

    run-dev-all() {
      start-docker-db
      trap "echo '>>> Stopping all dev services...'; stop-docker-db; exit" SIGINT
      sleep 5
      run-alembic-upgrade
      bash -c '
        trap "exit" SIGINT
        (cd backend && exec uvicorn main:app --reload) &
        backend_pid=$!
        (cd web && exec npm run dev) &
        web_pid=$!
        wait $backend_pid $web_pid
      '
      stop-docker-db
    }

    clean-dev() {
      echo ">>> Stopping and removing dev containers and volumes…"
      docker rm -f dev-postgres dev-redis 2>/dev/null || true
      docker volume rm dev-postgres-data 2>/dev/null || true
      echo ">>> Cleaned dev environment."
    }

    run-alembic() {
      (cd backend && alembic "$@")
    }

    run-alembic-upgrade() {
      run-alembic upgrade head
    }

    psql-dev() {
      PGPASSWORD="${pgPassword}" psql \
        -h localhost \
        -U "${pgUser}" \
        -d "${pgDatabase}"
    }

    echo ">>> Done. Commands available: run-dev-backend, run-dev-web, run-dev-all, run-alembic, run-alembic-upgrade, psql-dev, clean-dev"
  '';
}
