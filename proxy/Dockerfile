# syntax=docker/dockerfile:1

FROM nixos/nix:2.28.4 AS builder

RUN printf '%s\n' \
      'extra-experimental-features = nix-command flakes' \
      'filter-syscalls = false' \
      >> /etc/nix/nix.conf

WORKDIR /build

COPY flake.nix flake.lock ./
COPY nix ./nix
COPY proxy ./proxy

RUN nix build "path:/build#proxy-rootfs" --out-link /rootfs

FROM scratch

COPY --from=builder /rootfs/ /

ENV PATH=/bin \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    FRONTEND_HOST=127.0.0.1:3000 \
    BACKEND_HOST=127.0.0.1:8000 \
    KEYCLOAK_HOST=127.0.0.1:8080 \
    NGINX_PREFIX=/tmp/helpwave-tasks-proxy

EXPOSE 80

ENTRYPOINT ["/bin/tasks-proxy"]
