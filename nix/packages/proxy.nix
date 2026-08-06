{
  lib,
  nginx,
  busybox,
  writeTextDir,
  writeScriptBin,
}:

let
  nginxMainConf = writeTextDir "conf/nginx.conf" ''
    user root root;
    worker_processes auto;
    error_log /dev/stderr warn;
    pid /tmp/nginx.pid;
    daemon off;

    events {
        worker_connections 1024;
    }

    http {
        include       ${nginx}/conf/mime.types;
        default_type  application/octet-stream;
        access_log    /dev/stdout;
        client_max_body_size 20M;
        client_body_temp_path /tmp/client_body_temp;
        proxy_temp_path       /tmp/proxy_temp;
        fastcgi_temp_path     /tmp/fastcgi_temp;
        uwsgi_temp_path       /tmp/uwsgi_temp;
        scgi_temp_path        /tmp/scgi_temp;

        upstream frontend_upstream {
            server ''${FRONTEND_HOST};
        }

        upstream backend_upstream {
            server ''${BACKEND_HOST};
        }

        upstream keycloak_upstream {
            server ''${KEYCLOAK_HOST};
        }

        server {
            listen 80;
            server_name localhost;

            location ~ ^/(graphql|callback|export(/.*)?)$ {
                proxy_pass http://backend_upstream;

                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
            }

            location /keycloak/ {
                proxy_pass http://keycloak_upstream/keycloak/;

                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                proxy_http_version 1.1;
            }

            location / {
                proxy_pass http://frontend_upstream;

                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";

                proxy_hide_header Cache-Control;
                proxy_hide_header Pragma;
                add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
                add_header Pragma "no-cache" always;
                add_header Expires "0" always;
            }
        }
    }
  '';
in
(writeScriptBin "tasks-proxy" ''
  #!${busybox}/bin/sh
  set -eu

  export PATH="${nginx}/bin:${busybox}/bin''${PATH:+:$PATH}"

  : "''${FRONTEND_HOST:=127.0.0.1:3000}"
  : "''${BACKEND_HOST:=127.0.0.1:8000}"
  : "''${KEYCLOAK_HOST:=127.0.0.1:8080}"

  mkdir -p /tmp/client_body_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp /var/log/nginx

  conf=/tmp/helpwave-tasks-nginx.conf
  sed \
    -e "s|\''${FRONTEND_HOST}|$FRONTEND_HOST|g" \
    -e "s|\''${BACKEND_HOST}|$BACKEND_HOST|g" \
    -e "s|\''${KEYCLOAK_HOST}|$KEYCLOAK_HOST|g" \
    "${nginxMainConf}/conf/nginx.conf" \
    > "$conf"

  exec nginx -c "$conf"
'').overrideAttrs
  (old: {
    meta = (old.meta or { }) // {
      description = "helpwave tasks nginx reverse proxy";
      homepage = "https://github.com/helpwave/tasks";
      license = lib.licenses.mpl20;
      mainProgram = "tasks-proxy";
    };
  })
