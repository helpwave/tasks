{
  description = "helpwave tasks — healthcare ward and task management";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{
      self,
      flake-parts,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      imports = [
        ./nix/packages
        ./nix/shells
        ./nix/apps.nix
        ./nix/checks.nix
      ];

      flake = {
        nixosModules.default =
          { lib, pkgs, ... }:
          {
            imports = [ ./nix/modules/tasks.nix ];
            services.helpwave-tasks = {
              backend.package = lib.mkDefault self.packages.${pkgs.stdenv.hostPlatform.system}.backend;
              web.package = lib.mkDefault self.packages.${pkgs.stdenv.hostPlatform.system}.web;
              simulator.package = lib.mkDefault self.packages.${pkgs.stdenv.hostPlatform.system}.simulator;
              proxy.package = lib.mkDefault self.packages.${pkgs.stdenv.hostPlatform.system}.proxy;
            };
          };

        overlays.default = final: _prev: {
          helpwave-tasks-backend = self.packages.${final.stdenv.hostPlatform.system}.backend;
          helpwave-tasks-web = self.packages.${final.stdenv.hostPlatform.system}.web;
          helpwave-tasks-simulator = self.packages.${final.stdenv.hostPlatform.system}.simulator;
          helpwave-tasks-proxy = self.packages.${final.stdenv.hostPlatform.system}.proxy;
        };
      };
    };
}
