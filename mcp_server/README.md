# MCP Notes

The MCP server implementation lives in `mcp_server/`.

## Development Mode

To run the MCP server and Backend without authentication (for development only), set the environment variable `DEV_MODE_NO_AUTH=true` for both the Backend and the MCP Server.

### Backend Setup

Ensure your backend environment (e.g., in `docker-compose.dev.yml` or `.env`) includes:

```bash
DEV_MODE_NO_AUTH=true
```

This triggers `ALLOW_UNAUTHENTICATED_ACCESS=true` in the backend configuration.

### MCP Server Setup

Run the MCP server with the same environment variable:

```bash
export DEV_MODE_NO_AUTH=true
# run your server
```

This will prevent the MCP server from looking for an access token if one is not provided.
