{ ... }:
{
  perSystem =
    { config, lib, ... }:
    {
      apps = {
        default = {
          type = "app";
          program = lib.getExe config.packages.default;
          meta.description = "helpwave tasks flake usage help";
        };
        backend = {
          type = "app";
          program = lib.getExe config.packages.backend;
          meta.description = "helpwave tasks GraphQL API backend";
        };
        web = {
          type = "app";
          program = lib.getExe config.packages.web;
          meta.description = "helpwave tasks Next.js frontend";
        };
        simulator = {
          type = "app";
          program = lib.getExe config.packages.simulator;
          meta.description = "helpwave tasks clinic traffic simulator";
        };
        proxy = {
          type = "app";
          program = lib.getExe config.packages.proxy;
          meta.description = "helpwave tasks nginx reverse proxy";
        };
      };
    };
}
