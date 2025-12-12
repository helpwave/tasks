import { z } from 'zod'

export const publicEnvSchema = z.object({
  NODE_ENV: z.string().default('production'),
  RUNTIME_SHOW_STAGING_DISCLAIMER_MODAL: z.literal('true').or(z.literal('false')).optional(),
  RUNTIME_FEATURES_FEED_URL: z.string().url().default('https://cdn.helpwave.de/feed.json'),
  RUNTIME_IMPRINT_URL: z.string().url().default('https://cdn.helpwave.de/imprint.html'),
  RUNTIME_PRIVACY_URL: z.string().url().default('https://cdn.helpwave.de/privacy.html'),
  RUNTIME_GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:8000/graphql'),
  RUNTIME_ISSUER_URI: z.string().url().default('http://localhost:8080/realms/tasks'),
  RUNTIME_CLIENT_ID: z.string().min(1).default('tasks-web'),
  RUNTIME_REDIRECT_URI: z.string().min(1).default('http://localhost:3000/auth/callback'),
  RUNTIME_POST_LOGOUT_REDIRECT_URI: z.string().min(1).default('http://localhost:3000/'),
})

const configSchema = publicEnvSchema.transform(obj => ({
  env: obj.NODE_ENV,
  showStagingDisclaimerModal: obj.RUNTIME_SHOW_STAGING_DISCLAIMER_MODAL === 'true',
  featuresFeedUrl: obj.RUNTIME_FEATURES_FEED_URL,
  imprintUrl: obj.RUNTIME_IMPRINT_URL,
  privacyUrl: obj.RUNTIME_PRIVACY_URL,
  graphqlEndpoint: obj.RUNTIME_GRAPHQL_ENDPOINT,
  auth: {
    issuer: obj.RUNTIME_ISSUER_URI,
    clientId: obj.RUNTIME_CLIENT_ID,
    redirect_uri: obj.RUNTIME_REDIRECT_URI,
    post_logout_redirect_uri: obj.RUNTIME_POST_LOGOUT_REDIRECT_URI,
  }
}))

const getConfig = () => {
  if (typeof window !== 'undefined' && window.__ENV) {
    return configSchema.parse({
      ...window.__ENV,
      NODE_ENV: process.env.NODE_ENV
    })
  }

  const result = publicEnvSchema.safeParse(process.env)

  return configSchema.parse(result.data)
}

export { getConfig }
