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

## Organization Configuration

The application uses an organization claim to associate users with organizations. This claim is included in access tokens and is used to determine which locations a user can access.

### Setting Up Organization Client Scope

The organization client scope should already be configured in the imported realm. To verify or configure it manually:

1. Navigate to **Client scopes** in the left sidebar
2. Find the **organization** client scope
3. Verify it has the following settings:
   - **Name**: `organization`
   - **Description**: "Additional claims about the organization a subject belongs to"
   - **Include in token scope**: Enabled
   - **Display on consent screen**: Enabled

4. Under **Mappers**, verify there is a mapper named **organization** with:
   - **Mapper Type**: User Attribute
   - **User Attribute**: `organization`
   - **Token Claim Name**: `organization`
   - **Claim JSON Type**: String
   - **Multivalued**: Enabled
   - **Add to access token**: Enabled
   - **Add to ID token**: Enabled
   - **Add to userinfo**: Enabled

### Adding Organization Scope to Clients

The organization scope should be included in the default client scopes for `tasks-backend`. To verify or configure:

1. Navigate to **Clients** in the left sidebar
2. Select the **tasks-backend** client
3. Go to the **Client scopes** tab
4. Under **Default Client Scopes**, verify that **organization** is listed
5. If not present, move it from **Optional Client Scopes** to **Default Client Scopes**

### Adding Users to Organizations

To assign a user to one or more organizations:

1. Navigate to **Users** in the left sidebar
2. Select the user you want to configure (or create a new user)
3. Go to the **Attributes** tab
4. Click **Add** to add a new attribute
5. Set the **Key** to: `organization`
6. Set the **Value** to a comma-separated list of organization IDs (e.g., `test-org-1,test-org-2`)
7. Click **Save**

**Note**: The organization attribute is multivalued, so you can add multiple values. Each value should be a single organization ID. For multiple organizations, add them as separate attribute entries or use a comma-separated string.

### Verifying Organization Claim in Tokens

To verify that the organization claim is being included in tokens:

1. Navigate to **Clients** → **tasks-backend** → **Client scopes** tab
2. Ensure **organization** is in the **Default Client Scopes** list
3. When a user authenticates, the access token should include an `organization` claim with the values from the user's `organization` attribute

### Realm-Level Default Client Scopes

To ensure the organization scope is available by default for all clients:

1. Navigate to **Client scopes** in the left sidebar
2. Click on the **Default** tab at the top
3. Verify that **organization** is listed in the **Default Default Client Scopes**
4. If not, you can move it from **Optional** to **Default** using the arrow buttons

## Production

For production deployments, you should:
1. Change all default passwords
2. Configure proper client secrets
3. Set up proper redirect URIs
4. Configure SSL/TLS
5. Review and adjust security settings
6. Ensure organization attributes are properly configured for all users
