{ lib, pkgs }:

{
  package,
  name,
  tag ? "latest",
  extraPackages ? [ ],
  entrypoint,
  env ? [ ],
  exposedPorts ? [ "80" ],
}:

let
  contents = [
    package
    pkgs.bash
    pkgs.coreutils
    pkgs.gnugrep
    pkgs.gnused
    pkgs.dockerTools.binSh
    pkgs.dockerTools.usrBinEnv
    pkgs.dockerTools.caCertificates
    pkgs.dockerTools.fakeNss
  ]
  ++ extraPackages;
in
pkgs.dockerTools.streamLayeredImage {
  inherit name tag;
  inherit contents;
  maxLayers = 100;
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
