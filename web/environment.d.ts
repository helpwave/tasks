// import '@helpwave/api-services/environment'
// ^ This import extends the namespace of the ProcessEnv

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV?: string,
        NEXT_PUBLIC_SHOW_STAGING_DISCLAIMER_MODAL?: string,
        NEXT_PUBLIC_FEATURES_FEED_URL?: string,
        NEXT_PUBLIC_IMPRINT_URL?: string,
        NEXT_PUBLIC_PRIVACY_URL?: string,
        GRAPHQL_TOKEN?: string,
        NEXT_PUBLIC_GRAPHQL_ENDPOINT?: string,
        NEXT_PUBLIC_ISSUER_URI?: string,
        NEXT_PUBLIC_CLIENT_ID?: string,
        NEXT_PUBLIC_REDIRECT_URI?: string,
        NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI?: string,
    }
}
