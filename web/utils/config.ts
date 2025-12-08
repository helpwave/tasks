import { z } from 'zod'

export const publicEnvSchema = z.object({
  NODE_ENV: z.literal('production').or(z.literal('development')).default('production'),
  NEXT_PUBLIC_SHOW_STAGING_DISCLAIMER_MODAL: z.literal('true').or(z.literal('false')).optional(),
  NEXT_PUBLIC_FEATURES_FEED_URL: z.string().url().default('https://cdn.helpwave.de/feed.json'),
  NEXT_PUBLIC_IMPRINT_URL: z.string().url().default('https://cdn.helpwave.de/imprint.html'),
  NEXT_PUBLIC_PRIVACY_URL: z.string().url().default('https://cdn.helpwave.de/privacy.html'),
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:8000/graphql'),
  NEXT_PUBLIC_ISSUER_URI: z.string().url().default('http://localhost:8080/realms/tasks'),
  NEXT_PUBLIC_CLIENT_ID: z.string().min(1).default('tasks-web'),
  NEXT_PUBLIC_REDIRECT_URI: z.string().min(1).default('http://localhost:3000/auth/callback'),
  NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI: z.string().min(1).default('http://localhost:3000/'),
})

const configSchema = publicEnvSchema.transform(obj => ({
  env: obj.NODE_ENV,
  showStagingDisclaimerModal: obj.NEXT_PUBLIC_SHOW_STAGING_DISCLAIMER_MODAL === 'true',
  featuresFeedUrl: obj.NEXT_PUBLIC_FEATURES_FEED_URL,
  imprintUrl: obj.NEXT_PUBLIC_IMPRINT_URL,
  privacyUrl: obj.NEXT_PUBLIC_PRIVACY_URL,
  graphqlEndpoint: obj.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  auth: {
    issuer: obj.NEXT_PUBLIC_ISSUER_URI,
    clientId: obj.NEXT_PUBLIC_CLIENT_ID,
    redirect_uri: obj.NEXT_PUBLIC_REDIRECT_URI,
    post_logout_redirect_uri: obj.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI,
  }
}))

const getConfig = () => {
  const localOverrides: Partial<z.output<typeof configSchema>> = {}

  const source = (typeof window !== 'undefined' && window.__ENV)
    ? window.__ENV
    : process.env

  const maybeConfig = configSchema.safeParse(source)

  if (!maybeConfig.success) {
    throw new Error(`Invalid environment variables:\n${maybeConfig.error}`)
  } else {
    return Object.assign(maybeConfig.data, localOverrides)
  }
}

export { getConfig }
