{
  lib,
  writeShellApplication,
}:

writeShellApplication {
  name = "helpwave-tasks";
  text = ''
    cat <<'EOF'
    helpwave tasks — Nix flake

    Packages
      nix build github:helpwave/tasks#backend
      nix build github:helpwave/tasks#web
      nix build github:helpwave/tasks#simulator
      nix build github:helpwave/tasks#proxy

    Scratch images (stream → docker load)
      nix build github:helpwave/tasks#backend-docker && ./result | docker load
      nix build github:helpwave/tasks#web-docker && ./result | docker load
      nix build github:helpwave/tasks#proxy-docker && ./result | docker load
      nix build github:helpwave/tasks#simulator-docker && ./result | docker load

    Or two-step Dockerfiles (nix builder → scratch)
      docker build -f backend/Dockerfile -t helpwave-tasks-backend .
      docker build -f web/Dockerfile -t helpwave-tasks-web .

    Run
      nix run github:helpwave/tasks#backend
      nix run github:helpwave/tasks#web

    Install
      nix profile install github:helpwave/tasks#backend
      nix profile install github:helpwave/tasks#web

    Develop
      nix develop github:helpwave/tasks
      run-dev-all

    NixOS
      inputs.helpwave-tasks.url = "github:helpwave/tasks";
      imports = [ helpwave-tasks.nixosModules.default ];
      services.helpwave-tasks.enable = true;

    Docs: https://github.com/helpwave/tasks
    EOF
  '';

  meta = {
    description = "helpwave tasks flake usage help";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "helpwave-tasks";
  };
}
