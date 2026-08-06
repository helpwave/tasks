{ lib, pkgs }:

{
  package,
  pname,
  extraPackages ? [ ],
  emptyDirs ? [ ],
  basePackages ? [
    pkgs.busybox
    pkgs.dockerTools.caCertificates
    pkgs.dockerTools.fakeNss
  ],
}:

let
  contents = pkgs.buildEnv {
    name = "${pname}-image-contents";
    paths = [ package ] ++ basePackages ++ extraPackages;
    pathsToLink = [
      "/bin"
      "/etc"
      "/lib"
      "/sbin"
      "/share"
      "/usr"
    ];
  };

  closureInfo = pkgs.closureInfo { rootPaths = [ contents ]; };
in
pkgs.runCommand "${pname}-rootfs" { } ''
  mkdir -p "$out/nix/store"
  while IFS= read -r path; do
    cp -a "$path" "$out/nix/store/"
  done < ${closureInfo}/store-paths

  cp -a ${contents}/. "$out/"
  chmod -R u+w "$out"

  rm -rf "$out/tmp" "$out/var" "$out/run" "$out/proc" "$out/sys" "$out/dev"
  mkdir -p "$out/tmp" "$out/var/tmp" "$out/run" "$out/proc" "$out/sys" "$out/dev"
  chmod 1777 "$out/tmp" "$out/var/tmp"
  ${lib.concatMapStringsSep "\n" (dir: ''mkdir -p "$out/${dir}"'') emptyDirs}
''
