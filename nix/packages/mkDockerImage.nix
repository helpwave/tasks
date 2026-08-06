{ lib, pkgs }:

{
  package,
  name,
  tag ? "latest",
  extraPackages ? [ ],
  entrypoint,
  env ? [ ],
  exposedPorts ? [ "80" ],
  emptyDirs ? [ ],
  basePackages ? [
    pkgs.busybox
    pkgs.dockerTools.caCertificates
    pkgs.dockerTools.fakeNss
  ],
}:

let
  contents = [ package ] ++ basePackages ++ extraPackages;
in
pkgs.dockerTools.streamLayeredImage {
  inherit name tag;
  inherit contents;
  maxLayers = 100;
  extraCommands = lib.concatMapStringsSep "\n" (dir: "mkdir -p ./${dir}") emptyDirs;
  config = {
    Entrypoint = entrypoint;
    Env = [
      "PATH=/bin"
      "SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt"
    ]
    ++ env;
    ExposedPorts = lib.listToAttrs (
      map (port: {
        name = "${port}/tcp";
        value = { };
      }) exposedPorts
    );
  };
}
