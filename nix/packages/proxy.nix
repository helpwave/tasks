{
  lib,
  writeShellApplication,
  nginx,
}:

writeShellApplication {
  name = "tasks-proxy";
  runtimeInputs = [ nginx ];
  text = ''
    : "''${FRONTEND_HOST:=127.0.0.1:3000}"
    : "''${BACKEND_HOST:=127.0.0.1:8000}"
    : "''${KEYCLOAK_HOST:=127.0.0.1:8080}"
    : "''${NGINX_PREFIX:=''${XDG_RUNTIME_DIR:-/tmp}/helpwave-tasks-proxy}"

    mkdir -p "$NGINX_PREFIX/logs" "$NGINX_PREFIX/conf" "$NGINX_PREFIX/tmp"

    sed \
      -e "s|\''${FRONTEND_HOST}|$FRONTEND_HOST|g" \
      -e "s|\''${BACKEND_HOST}|$BACKEND_HOST|g" \
      -e "s|\''${KEYCLOAK_HOST}|$KEYCLOAK_HOST|g" \
      -e "s|include       mime.types;|include ${nginx}/conf/mime.types;|" \
      "${../../proxy/nginx.conf}" \
      > "$NGINX_PREFIX/conf/nginx.body.conf"

    cat > "$NGINX_PREFIX/conf/nginx.conf" <<EOF
    pid $NGINX_PREFIX/nginx.pid;
    error_log $NGINX_PREFIX/logs/error.log warn;
    daemon off;
    worker_processes auto;
    EOF

    cat "$NGINX_PREFIX/conf/nginx.body.conf" >> "$NGINX_PREFIX/conf/nginx.conf"

    exec nginx -p "$NGINX_PREFIX" -c "$NGINX_PREFIX/conf/nginx.conf"
  '';

  meta = {
    description = "helpwave tasks nginx reverse proxy";
    homepage = "https://github.com/helpwave/tasks";
    license = lib.licenses.mpl20;
    mainProgram = "tasks-proxy";
  };
}
