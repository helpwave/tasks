# syntax=docker/dockerfile:1

FROM nixos/nix:2.28.4 AS builder

RUN printf '%s\n' \
      'extra-experimental-features = nix-command flakes' \
      'filter-syscalls = false' \
      >> /etc/nix/nix.conf

WORKDIR /build

COPY flake.nix flake.lock ./
COPY nix ./nix
COPY web ./web

RUN nix build "path:/build#web-rootfs" --out-link /rootfs

FROM scratch

COPY --from=builder /rootfs/ /

ENV PATH=/bin \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    HOSTNAME=0.0.0.0 \
    PORT=80 \
    NODE_ENV=production \
    TASKS_WEB_RUNTIME_DIR=/tmp/helpwave-tasks-web \
    FEEDBACK_DIRECTORY=/feedback \
    PROFILE_PICTURE_DIRECTORY=/profile

EXPOSE 80

ENTRYPOINT ["/bin/tasks-web"]
