# Proxy

Nginx reverse proxy for production deployments of the helpwave tasks platform.

## Features

- Routes requests to appropriate services (frontend, backend, keycloak)
- Handles SSL/TLS termination (when configured)
- Load balancing capabilities
- Health check endpoints

## Configuration

The proxy uses environment variables for configuration:

- `FRONTEND_HOST` - Frontend service host (default: `web:80`)
- `BACKEND_HOST` - Backend service host (default: `backend:80`)
- `KEYCLOAK_HOST` - Keycloak service host (default: `keycloak:8080`)

## Docker

The proxy is containerized and available as:

```bash
docker run --rm \
  -e FRONTEND_HOST=web:80 \
  -e BACKEND_HOST=backend:80 \
  -e KEYCLOAK_HOST=keycloak:8080 \
  -p 80:80 \
  ghcr.io/helpwave/tasks-proxy:latest
```

## Routes

- `/` - Frontend application
- `/graphql` - Backend GraphQL API
- `/keycloak` - Keycloak authentication service

## Production

For production deployments, you should:
1. Configure SSL/TLS certificates
2. Set up proper domain names
3. Configure rate limiting
4. Set up monitoring and logging
5. Review security headers

