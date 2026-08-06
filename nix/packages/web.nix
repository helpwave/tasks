{
  lib,
  buildNpmPackage,
  nodejs_22,
  nodejs-slim_22,
  pkgs,
  writeScript,
}:

let
  nodejsRuntime = import ./nodejs-runtime.nix {
    inherit lib pkgs;
    nodejs-slim = nodejs-slim_22;
  };

  launcher = writeScript "tasks-web-launch" ''
    #!${pkgs.busybox}/bin/sh
    set -eu

    app="@out@/lib/helpwave-tasks-web"
    runtime="''${TASKS_WEB_RUNTIME_DIR:-''${XDG_RUNTIME_DIR:-/tmp}/helpwave-tasks-web-$$}"
    mkdir -p "$runtime"

    cp -a "$app/." "$runtime/"
    mkdir -p "$runtime/public"

    {
      echo "window.__ENV = {"
      env | while IFS='=' read -r key val; do
        case "$key" in
          RUNTIME_*)
            val=$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g')
            printf '  "%s": "%s",\n' "$key" "$val"
            ;;
        esac
      done
      echo "}"
    } > "$runtime/public/env-config.js"

    export NODE_ENV="''${NODE_ENV:-production}"
    export PORT="''${PORT:-3000}"
    export HOSTNAME="''${HOSTNAME:-0.0.0.0}"

    cd "$runtime"
    exec ${nodejsRuntime}/bin/node server.js "$@"
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

    find "$out/lib/helpwave-tasks-web" -type d \( \
      -name '*musl*' -o \
      -name '*wasm32*' -o \
      -name '*darwin*' -o \
      -name '*win32*' -o \
      -name '*linux-arm*' \
    \) | while IFS= read -r dir; do
      rm -rf "$dir"
    done

    rm -rf "$out/lib/helpwave-tasks-web/node_modules/@img/@img"

    substitute ${launcher} $out/bin/tasks-web --subst-var-by out $out
    chmod +x $out/bin/tasks-web

    runHook postInstall
  '';

  postFixup = ''
    find "$out" -type f -print0 | xargs -0 sed -i \
      "s|${nodejs_22}/bin/node|${nodejsRuntime}/bin/node|g"
  '';

  disallowedRequisites = [
    nodejs_22
    nodejs-slim_22
  ];

  meta = {
    description = "helpwave tasks Next.js frontend";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "tasks-web";
    platforms = lib.platforms.unix;
  };
}
