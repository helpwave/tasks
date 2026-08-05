{ ... }:
{
  perSystem =
    { config, ... }:
    {
      checks = {
        backend = config.packages.backend;
        web = config.packages.web;
        simulator = config.packages.simulator;
        proxy = config.packages.proxy;
      };
    };
}
