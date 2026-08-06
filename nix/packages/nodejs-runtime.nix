{
  lib,
  pkgs,
  nodejs-slim,
}:

let
  uvwasi = pkgs.uvwasi;
  libuv = pkgs.libuv;
in
pkgs.runCommand "nodejs-runtime"
  {
    nativeBuildInputs = [
      pkgs.removeReferencesTo
      pkgs.binutils
      pkgs.patchelf
    ];
    disallowedRequisites = [
      nodejs-slim
      libuv.dev
    ];
  }
  ''
    mkdir -p "$out/bin" "$out/lib"
    cp -L ${lib.getExe nodejs-slim} "$out/bin/node"
    chmod +w "$out/bin/node"

    cp -L ${uvwasi}/lib/libuvwasi.so "$out/lib/" || cp -L ${uvwasi}/lib/libuvwasi.so* "$out/lib/"
    chmod +w "$out"/lib/libuvwasi.so*
    remove-references-to -t "${libuv.dev}" "$out"/lib/libuvwasi.so*

    old_rpath="$(patchelf --print-rpath "$out/bin/node")"
    patchelf --set-rpath "$out/lib:$old_rpath" "$out/bin/node"
    remove-references-to -t "${uvwasi}" "$out/bin/node"

    strings "$out/bin/node" \
      | grep -oE '/nix/store/[a-z0-9]{32}-[^[:space:]"]+-dev' \
      | sort -u \
      | while IFS= read -r ref; do
          remove-references-to -t "$ref" "$out/bin/node"
        done

    remove-references-to -t "${nodejs-slim}" "$out/bin/node"
  ''
