{
  lib,
  pkgs,
  writeShellScriptBin,
  backend,
  web,
  simulator,
  proxy,
}:

let
  mkRootfs = import ./mkRootfs.nix { inherit pkgs; };
  mkDockerImage = import ./mkDockerImage.nix { inherit lib pkgs; };

  backendEntrypoint = writeShellScriptBin "docker-entrypoint" ''
    set -euo pipefail
    tasks-alembic upgrade head
    exec tasks-backend "$@"
  '';

  backendExtra = [ backendEntrypoint ];
  backendEnv = [
    "HOST=0.0.0.0"
    "PORT=80"
    "ENV=production"
  ];

  webEnv = [
    "HOSTNAME=0.0.0.0"
    "PORT=80"
    "NODE_ENV=production"
    "TASKS_WEB_RUNTIME_DIR=/tmp/helpwave-tasks-web"
  ];

  proxyEnv = [
    "FRONTEND_HOST=127.0.0.1:3000"
    "BACKEND_HOST=127.0.0.1:8000"
    "KEYCLOAK_HOST=127.0.0.1:8080"
  ];
in
{
  backend-rootfs = mkRootfs {
    package = backend;
    pname = "helpwave-tasks-backend";
    extraPackages = backendExtra;
  };

  web-rootfs = mkRootfs {
    package = web;
    pname = "helpwave-tasks-web";
  };

  simulator-rootfs = mkRootfs {
    package = simulator;
    pname = "helpwave-tasks-simulator";
  };

  proxy-rootfs = mkRootfs {
    package = proxy;
    pname = "helpwave-tasks-proxy";
  };

  backend-docker = mkDockerImage {
    package = backend;
    name = "helpwave-tasks-backend";
    extraPackages = backendExtra;
    entrypoint = [ "${backendEntrypoint}/bin/docker-entrypoint" ];
    env = backendEnv;
  };

  web-docker = mkDockerImage {
    package = web;
    name = "helpwave-tasks-web";
    entrypoint = [ "${web}/bin/tasks-web" ];
    env = webEnv;
  };

  simulator-docker = mkDockerImage {
    package = simulator;
    name = "helpwave-tasks-simulator";
    entrypoint = [ "${simulator}/bin/tasks-simulator" ];
    env = [ ];
  };

  proxy-docker = mkDockerImage {
    package = proxy;
    name = "helpwave-tasks-proxy";
    entrypoint = [ "${proxy}/bin/tasks-proxy" ];
    env = proxyEnv;
  };
}
