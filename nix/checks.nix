{ inputs, ... }:
{
  perSystem =
    { pkgs, config, ... }:
    {
      checks = {
        backend = config.packages.backend;
        web = config.packages.web;
        simulator = config.packages.simulator;
        proxy = config.packages.proxy;
        ruff =
          pkgs.runCommand "ruff-check"
            {
              nativeBuildInputs = [ pkgs.ruff ];
              src = inputs.self;
            }
            ''
              ruff check "$src/backend" --output-format=concise --exclude database/migrations
              ruff check "$src/simulator" --output-format=concise
              touch "$out"
            '';
      };
    };
}
