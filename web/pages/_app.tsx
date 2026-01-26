import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google'
import { ApolloProvider } from '@apollo/client/react'
import {
  HightideProvider
} from '@helpwave/hightide'
import titleWrapper from '@/utils/titleWrapper'
import { getConfig } from '@/utils/config'
import '../globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { TasksContextProvider } from '@/hooks/useTasksContext'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { registerServiceWorker, requestNotificationPermission } from '@/utils/pushNotifications'
import { useEffect } from 'react'
import { apolloClient } from '@/utils/apolloClient'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

const config = getConfig()

function MyApp({
  Component,
  pageProps
}: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker().then((registration) => {
        if (registration) {
          requestNotificationPermission().catch(() => {})
        }
      }).catch(() => {})
    }
  }, [])

  return (
    <HightideProvider>
      <ApolloProvider client={apolloClient}>
        <Head>
          <title>{titleWrapper()}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
          <style
            dangerouslySetInnerHTML={{
              __html: `
                  :root {
                    --font-inter: ${inter.style.fontFamily};
                    --font-space: ${spaceGrotesk.style.fontFamily};
                  }
                `,
            }}
          />
        </Head>
        <AuthProvider
          ignoredURLs={[
            '/auth/callback',
          ]}
        >
          <TasksContextProvider>
            <SubscriptionProvider>
              <Component {...pageProps} />
              <InstallPrompt />
            </SubscriptionProvider>
          </TasksContextProvider>
        </AuthProvider>
      </ApolloProvider>
    </HightideProvider>
  )
}

export default MyApp
