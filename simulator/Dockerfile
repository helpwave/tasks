# syntax=docker/dockerfile:1

FROM nixos/nix:2.28.4 AS builder

RUN printf '%s\n' \
      'extra-experimental-features = nix-command flakes' \
      'filter-syscalls = false' \
      >> /etc/nix/nix.conf

WORKDIR /build

COPY flake.nix flake.lock ./
COPY nix ./nix
COPY simulator ./simulator

RUN nix build "path:/build#simulator-rootfs" --out-link /rootfs

FROM scratch

COPY --from=builder /rootfs/ /

ENV PATH=/bin \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["/bin/tasks-simulator"]
