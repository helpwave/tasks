{
  lib,
  stdenv,
  python313,
  writeShellScript,
}:

let
  pythonEnv = import ./python-env.nix { python3 = python313; };

  backendSrc = lib.cleanSourceWith {
    src = ../../backend;
    filter =
      path: _type:
      let
        base = baseNameOf path;
      in
      !(builtins.elem base [
        "venv"
        ".venv"
        "__pycache__"
        ".pytest_cache"
        ".ruff_cache"
        ".env"
        ".env.local"
      ]);
  };

  scaffoldSrc = lib.cleanSource ../../scaffold;

  launcher = writeShellScript "tasks-backend-launch" ''
    set -euo pipefail
    root="@out@/lib/helpwave-tasks-backend"
    export SCAFFOLD_DIRECTORY="''${SCAFFOLD_DIRECTORY:-@out@/share/helpwave-tasks/scaffold}"
    export PYTHONPATH="$root''${PYTHONPATH:+:$PYTHONPATH}"
    cd "$root"
    exec ${pythonEnv}/bin/uvicorn main:app \
      --proxy-headers \
      --host "''${HOST:-0.0.0.0}" \
      --port "''${PORT:-8000}" \
      "$@"
  '';

  alembicLauncher = writeShellScript "tasks-alembic-launch" ''
    set -euo pipefail
    root="@out@/lib/helpwave-tasks-backend"
    export PYTHONPATH="$root''${PYTHONPATH:+:$PYTHONPATH}"
    cd "$root"
    exec ${pythonEnv}/bin/alembic "$@"
  '';
in
stdenv.mkDerivation {
  pname = "helpwave-tasks-backend";
  version = "0.1.0";

  src = backendSrc;

  nativeBuildInputs = [ ];
  buildInputs = [ pythonEnv ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/helpwave-tasks-backend $out/share/helpwave-tasks $out/bin
    cp -r . $out/lib/helpwave-tasks-backend/
    cp -r ${scaffoldSrc} $out/share/helpwave-tasks/scaffold

    substitute ${launcher} $out/bin/tasks-backend --subst-var-by out $out
    substitute ${alembicLauncher} $out/bin/tasks-alembic --subst-var-by out $out
    chmod +x $out/bin/tasks-backend $out/bin/tasks-alembic

    runHook postInstall
  '';

  meta = {
    description = "helpwave tasks GraphQL API backend";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "tasks-backend";
    platforms = lib.platforms.unix;
  };
}
