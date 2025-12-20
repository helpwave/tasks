# Keycloak Configuration

This directory contains the Keycloak realm configuration for the helpwave tasks application.

## Disclaimer

`tasks.json` is a realm file. You can import it into your **development** keycloak. This configuration has preset credentials in it. Make sure to **not use it in production**.

## Usage

The realm file is automatically imported when using docker-compose with the keycloak service. The file is mounted as a read-only volume and imported on startup.

## Manual Import

1. Access Keycloak Admin Console: `http://localhost:8080/admin`
2. Login with admin credentials
3. Navigate to "Create Realm" or select existing realm
4. Click "Import" and select `tasks.json`

## Configuration

The realm includes:
- OAuth2 clients: `tasks-web`, `tasks-backend`
- Test user: `test` / `test`
- Realm name: `tasks`

## Production

For production deployments, you should:
1. Change all default passwords
2. Configure proper client secrets
3. Set up proper redirect URIs
4. Configure SSL/TLS
5. Review and adjust security settings
