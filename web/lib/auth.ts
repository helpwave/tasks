import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { getConfig } from '@/utils/config'

const config = getConfig()

export const userManager = new UserManager({
    authority: config.auth.issuer,
    client_id: config.auth.clientId,
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/signin-callback` : '',
    response_type: 'code',
    scope: 'openid profile email',
    userStore: typeof window !== 'undefined' ? new WebStorageStateStore({ store: window.localStorage }) : undefined,
    automaticSilentRenew: true,
    monitorSession: true,
})

export const signinRedirect = () => userManager.signinRedirect()

export const signoutRedirect = () => userManager.signoutRedirect()
