{
  config,
  lib,
  ...
}:

let
  cfg = config.services.helpwave-tasks;
  inherit (lib)
    mkEnableOption
    mkIf
    mkOption
    types
    optional
    optionals
    optionalAttrs
    ;
in
{
  options.services.helpwave-tasks = {
    enable = mkEnableOption "helpwave tasks";

    domain = mkOption {
      type = types.str;
      default = "localhost";
      description = "Public hostname used to derive default URLs.";
    };

    backend = {
      enable = mkOption {
        type = types.bool;
        default = true;
        description = "Enable the GraphQL API backend.";
      };

      package = mkOption {
        type = types.package;
        description = "Backend package providing tasks-backend and tasks-alembic.";
      };

      port = mkOption {
        type = types.port;
        default = 8000;
        description = "Port the backend listens on.";
      };

      host = mkOption {
        type = types.str;
        default = "127.0.0.1";
        description = "Bind address for the backend.";
      };

      environmentFile = mkOption {
        type = types.nullOr types.path;
        default = null;
        description = ''
          Environment file with secrets (DATABASE_URL / DB credentials, REDIS_URL,
          CLIENT_SECRET, INFLUXDB_TOKEN, etc.).
        '';
      };

      environment = mkOption {
        type = types.attrsOf types.str;
        default = { };
        description = "Extra environment variables for the backend.";
      };

      openFirewall = mkOption {
        type = types.bool;
        default = false;
        description = "Open the backend port in the firewall.";
      };
    };

    web = {
      enable = mkOption {
        type = types.bool;
        default = true;
        description = "Enable the Next.js frontend.";
      };

      package = mkOption {
        type = types.package;
        description = "Frontend package providing tasks-web.";
      };

      port = mkOption {
        type = types.port;
        default = 3000;
        description = "Port the frontend listens on.";
      };

      host = mkOption {
        type = types.str;
        default = "127.0.0.1";
        description = "Bind address for the frontend.";
      };

      runtime = mkOption {
        type = types.attrsOf types.str;
        default = { };
        description = ''
          RUNTIME_* variables written into env-config.js (and passed to the process).
          Defaults are derived from domain / ports when unset.
        '';
      };

      environmentFile = mkOption {
        type = types.nullOr types.path;
        default = null;
        description = "Optional environment file for the web process.";
      };

      openFirewall = mkOption {
        type = types.bool;
        default = false;
        description = "Open the web port in the firewall.";
      };
    };

    proxy = {
      enable = mkEnableOption "nginx reverse proxy for helpwave tasks";

      package = mkOption {
        type = types.package;
        description = "Proxy package providing tasks-proxy.";
      };

      openFirewall = mkOption {
        type = types.bool;
        default = true;
        description = "Open TCP port 80 for the proxy.";
      };
    };

    simulator = {
      package = mkOption {
        type = types.package;
        description = "Simulator package (installed into systemPackages).";
      };
    };

    database = {
      createLocally = mkOption {
        type = types.bool;
        default = true;
        description = "Provision a local PostgreSQL database for the backend.";
      };

      name = mkOption {
        type = types.str;
        default = "tasks";
        description = "Database name.";
      };

      user = mkOption {
        type = types.str;
        default = "helpwave-tasks";
        description = "Database role (should match the service user for peer auth).";
      };
    };

    redis = {
      createLocally = mkOption {
        type = types.bool;
        default = true;
        description = "Provision a local Redis instance.";
      };
    };

    influxdb = {
      createLocally = mkOption {
        type = types.bool;
        default = false;
        description = "Provision a local InfluxDB 2 instance for audit logs.";
      };

      organization = mkOption {
        type = types.str;
        default = "tasks";
        description = "InfluxDB organization.";
      };

      bucket = mkOption {
        type = types.str;
        default = "audit";
        description = "InfluxDB bucket.";
      };

      tokenFile = mkOption {
        type = types.nullOr types.path;
        default = null;
        description = "Path to a file containing the InfluxDB admin/API token.";
      };

      passwordFile = mkOption {
        type = types.nullOr types.path;
        default = null;
        description = "Path to a file containing the InfluxDB initial admin password.";
      };
    };

    keycloak = {
      createLocally = mkOption {
        type = types.bool;
        default = false;
        description = ''
          Enable services.keycloak. Realm import from this repository is left to the
          operator; set issuerUri to the resulting realm URL.
        '';
      };

      issuerUri = mkOption {
        type = types.str;
        default = "http://localhost:8080/realms/tasks";
        description = "OIDC issuer URI for the tasks realm.";
      };
    };
  };

  config =
    let
      publicOrigin = "http://${cfg.domain}";
      graphqlPublic =
        if cfg.proxy.enable then
          "${publicOrigin}/graphql"
        else
          "http://${cfg.domain}:${toString cfg.backend.port}/graphql";

      defaultWebRuntime = {
        RUNTIME_GRAPHQL_ENDPOINT = graphqlPublic;
        RUNTIME_ISSUER_URI = cfg.keycloak.issuerUri;
        RUNTIME_CLIENT_ID = "tasks-web";
        RUNTIME_REDIRECT_URI =
          if cfg.proxy.enable then
            "${publicOrigin}/auth/callback"
          else
            "http://${cfg.domain}:${toString cfg.web.port}/auth/callback";
        RUNTIME_POST_LOGOUT_REDIRECT_URI =
          if cfg.proxy.enable then "${publicOrigin}/" else "http://${cfg.domain}:${toString cfg.web.port}/";
      };

      webRuntime = defaultWebRuntime // cfg.web.runtime;

      redisPort =
        if cfg.redis.createLocally then config.services.redis.servers.helpwave-tasks.port else 6379;

      backendEnv = {
        ENV = "production";
        HOST = cfg.backend.host;
        PORT = toString cfg.backend.port;
        ISSUER_URI = cfg.keycloak.issuerUri;
        PUBLIC_ISSUER_URI = cfg.keycloak.issuerUri;
        ALLOWED_ORIGINS =
          if cfg.proxy.enable then publicOrigin else "http://${cfg.domain}:${toString cfg.web.port}";
      }
      // optionalAttrs cfg.database.createLocally {
        DATABASE_HOSTNAME = "/run/postgresql";
        DATABASE_NAME = cfg.database.name;
        DATABASE_USERNAME = cfg.database.user;
        DATABASE_URL = "postgresql+asyncpg://${cfg.database.user}@/${cfg.database.name}?host=/run/postgresql";
      }
      // optionalAttrs cfg.redis.createLocally {
        REDIS_HOSTNAME = "127.0.0.1";
        REDIS_PORT = toString redisPort;
        REDIS_URL = "redis://127.0.0.1:${toString redisPort}";
      }
      // optionalAttrs cfg.influxdb.createLocally {
        INFLUXDB_URL = "http://127.0.0.1:8086";
        INFLUXDB_ORG = cfg.influxdb.organization;
        INFLUXDB_BUCKET = cfg.influxdb.bucket;
      }
      // cfg.backend.environment;
    in
    mkIf cfg.enable {
      assertions = [
        {
          assertion =
            !cfg.influxdb.createLocally
            || (cfg.influxdb.tokenFile != null && cfg.influxdb.passwordFile != null);
          message = "services.helpwave-tasks.influxdb.tokenFile and passwordFile are required when createLocally is true.";
        }
      ];

      users.users.helpwave-tasks = {
        isSystemUser = true;
        group = "helpwave-tasks";
        description = "helpwave tasks service user";
      };
      users.groups.helpwave-tasks = { };

      services.postgresql = mkIf cfg.database.createLocally {
        enable = true;
        ensureDatabases = [ cfg.database.name ];
        ensureUsers = [
          {
            name = cfg.database.user;
            ensureDBOwnership = true;
          }
        ];
      };

      services.redis.servers.helpwave-tasks = mkIf cfg.redis.createLocally {
        enable = true;
        port = 6379;
      };

      services.influxdb2 = mkIf cfg.influxdb.createLocally {
        enable = true;
        provision = {
          enable = true;
          initialSetup = {
            organization = cfg.influxdb.organization;
            bucket = cfg.influxdb.bucket;
            passwordFile = cfg.influxdb.passwordFile;
            tokenFile = cfg.influxdb.tokenFile;
          };
        };
      };

      services.keycloak = mkIf cfg.keycloak.createLocally {
        enable = true;
        settings = {
          http-port = 8080;
          hostname-strict = false;
          http-enabled = true;
        };
      };

      systemd.services.helpwave-tasks-backend = mkIf cfg.backend.enable {
        description = "helpwave tasks backend";
        wantedBy = [ "multi-user.target" ];
        after = [
          "network-online.target"
        ]
        ++ optional cfg.database.createLocally "postgresql.service"
        ++ optional cfg.redis.createLocally "redis-helpwave-tasks.service"
        ++ optional cfg.influxdb.createLocally "influxdb2.service";
        wants = [ "network-online.target" ];

        serviceConfig = {
          Type = "simple";
          User = "helpwave-tasks";
          Group = "helpwave-tasks";
          ExecStartPre = "${cfg.backend.package}/bin/tasks-alembic upgrade head";
          ExecStart = "${cfg.backend.package}/bin/tasks-backend";
          Restart = "on-failure";
          RestartSec = 5;
          StateDirectory = "helpwave-tasks";
          EnvironmentFile = mkIf (cfg.backend.environmentFile != null) [ cfg.backend.environmentFile ];
        };

        environment = backendEnv;
      };

      systemd.services.helpwave-tasks-web = mkIf cfg.web.enable {
        description = "helpwave tasks web";
        wantedBy = [ "multi-user.target" ];
        after = [
          "network-online.target"
        ]
        ++ optional cfg.backend.enable "helpwave-tasks-backend.service";
        wants = [ "network-online.target" ];

        serviceConfig = {
          Type = "simple";
          User = "helpwave-tasks";
          Group = "helpwave-tasks";
          ExecStart = "${cfg.web.package}/bin/tasks-web";
          Restart = "on-failure";
          RestartSec = 5;
          StateDirectory = "helpwave-tasks-web";
          Environment = [
            "TASKS_WEB_RUNTIME_DIR=/var/lib/helpwave-tasks-web"
            "FEEDBACK_DIRECTORY=/var/lib/helpwave-tasks-web/feedback"
            "PROFILE_PICTURE_DIRECTORY=/var/lib/helpwave-tasks-web/profile"
            "PORT=${toString cfg.web.port}"
            "HOSTNAME=${cfg.web.host}"
            "NODE_ENV=production"
          ]
          ++ lib.mapAttrsToList (k: v: "${k}=${v}") webRuntime;
          EnvironmentFile = mkIf (cfg.web.environmentFile != null) [ cfg.web.environmentFile ];
        };
      };

      systemd.services.helpwave-tasks-proxy = mkIf cfg.proxy.enable {
        description = "helpwave tasks nginx proxy";
        wantedBy = [ "multi-user.target" ];
        after = [
          "network-online.target"
        ]
        ++ optional cfg.web.enable "helpwave-tasks-web.service"
        ++ optional cfg.backend.enable "helpwave-tasks-backend.service";

        serviceConfig = {
          Type = "simple";
          ExecStart = "${cfg.proxy.package}/bin/tasks-proxy";
          Restart = "on-failure";
          RestartSec = 5;
          RuntimeDirectory = "helpwave-tasks-proxy";
          Environment = [
            "FRONTEND_HOST=${cfg.web.host}:${toString cfg.web.port}"
            "BACKEND_HOST=${cfg.backend.host}:${toString cfg.backend.port}"
            "KEYCLOAK_HOST=127.0.0.1:8080"
            "NGINX_PREFIX=/run/helpwave-tasks-proxy"
          ];
          AmbientCapabilities = [ "CAP_NET_BIND_SERVICE" ];
          CapabilityBoundingSet = [ "CAP_NET_BIND_SERVICE" ];
          DynamicUser = true;
        };
      };

      networking.firewall.allowedTCPPorts =
        optionals cfg.backend.openFirewall [ cfg.backend.port ]
        ++ optionals cfg.web.openFirewall [ cfg.web.port ]
        ++ optionals (cfg.proxy.enable && cfg.proxy.openFirewall) [ 80 ];

      environment.systemPackages = [ cfg.simulator.package ];
    };
}
