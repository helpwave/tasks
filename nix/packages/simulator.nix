{
  lib,
  stdenv,
  python313,
  makeWrapper,
}:

let
  pythonEnv = python313.withPackages (
    ps: with ps; [
      python-dotenv
      requests
    ]
  );

  src = lib.cleanSourceWith {
    src = ../../simulator;
    filter =
      path: _type:
      let
        base = baseNameOf path;
      in
      !(builtins.elem base [
        "venv"
        ".venv"
        "__pycache__"
        ".env"
        ".env.local"
      ]);
  };
in
stdenv.mkDerivation {
  pname = "helpwave-tasks-simulator";
  version = "0.1.0";

  inherit src;

  nativeBuildInputs = [ makeWrapper ];
  buildInputs = [ pythonEnv ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/lib/helpwave-tasks-simulator $out/bin
    cp -r . $out/lib/helpwave-tasks-simulator/

    makeWrapper ${pythonEnv}/bin/python $out/bin/tasks-simulator \
      --chdir $out/lib/helpwave-tasks-simulator \
      --prefix PYTHONPATH : $out/lib/helpwave-tasks-simulator \
      --add-flags "$out/lib/helpwave-tasks-simulator/main.py"

    runHook postInstall
  '';

  meta = {
    description = "helpwave tasks clinic traffic simulator";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "tasks-simulator";
    platforms = lib.platforms.unix;
  };
}
