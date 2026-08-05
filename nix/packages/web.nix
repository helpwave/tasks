{
  lib,
  buildNpmPackage,
  nodejs_22,
  writeShellScript,
}:

let
  launcher = writeShellScript "tasks-web-launch" ''
    set -euo pipefail

    app="@out@/lib/helpwave-tasks-web"
    runtime="''${TASKS_WEB_RUNTIME_DIR:-''${XDG_RUNTIME_DIR:-/tmp}/helpwave-tasks-web-$$}"
    mkdir -p "$runtime"

    cp -a --no-preserve=mode "$app/." "$runtime/"
    mkdir -p "$runtime/public"

    {
      echo "window.__ENV = {"
      env | grep "^RUNTIME_" | while IFS= read -r line; do
        key=''${line%%=*}
        val=''${line#*=}
        val=''${val//\\/\\\\}
        val=''${val//\"/\\\"}
        printf '  "%s": "%s",\n' "$key" "$val"
      done
      echo "}"
    } > "$runtime/public/env-config.js"

    export NODE_ENV="''${NODE_ENV:-production}"
    export PORT="''${PORT:-3000}"
    export HOSTNAME="''${HOSTNAME:-0.0.0.0}"

    cd "$runtime"
    exec ${nodejs_22}/bin/node server.js "$@"
  '';
in
buildNpmPackage {
  pname = "helpwave-tasks-web";
  version = "0.1.0";

  src = lib.cleanSourceWith {
    src = ../../web;
    filter =
      path: _type:
      let
        base = baseNameOf path;
      in
      !(builtins.elem base [
        "node_modules"
        "build"
        ".next"
        ".env"
        ".env.local"
        "tsconfig.tsbuildinfo"
      ]);
  };

  npmDepsHash = "sha256-5dIfshqcfVQk96oDRwuiqpFeKkR4Ly6L0tC8+L8Is/s=";

  nodejs = nodejs_22;

  npmBuildScript = "build";

  buildPhase = ''
    runHook preBuild
    npm run build-intl
    npx next build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/helpwave-tasks-web $out/bin

    cp -r build/standalone/. $out/lib/helpwave-tasks-web/
    mkdir -p $out/lib/helpwave-tasks-web/build
    cp -r build/static $out/lib/helpwave-tasks-web/build/static
    cp -r public $out/lib/helpwave-tasks-web/public

    if [ -d node_modules/@img ]; then
      mkdir -p $out/lib/helpwave-tasks-web/node_modules
      cp -aL node_modules/@img $out/lib/helpwave-tasks-web/node_modules/@img
    fi

    substitute ${launcher} $out/bin/tasks-web --subst-var-by out $out
    chmod +x $out/bin/tasks-web

    runHook postInstall
  '';

  meta = {
    description = "helpwave tasks Next.js frontend";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "tasks-web";
    platforms = lib.platforms.unix;
  };
}
