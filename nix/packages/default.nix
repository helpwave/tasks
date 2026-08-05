{ ... }:
{
  perSystem =
    { pkgs, ... }:
    let
      backend = pkgs.callPackage ./backend.nix { };
      web = pkgs.callPackage ./web.nix { };
      simulator = pkgs.callPackage ./simulator.nix { };
      proxy = pkgs.callPackage ./proxy.nix { };
      docker = pkgs.callPackage ./docker.nix {
        inherit
          backend
          web
          simulator
          proxy
          ;
      };
    in
    {
      formatter = pkgs.nixfmt;

      packages = {
        inherit
          backend
          web
          simulator
          proxy
          ;
        inherit (docker)
          backend-rootfs
          web-rootfs
          simulator-rootfs
          proxy-rootfs
          backend-docker
          web-docker
          simulator-docker
          proxy-docker
          ;
        default = pkgs.callPackage ./default-app.nix { };
      };
    };
}
