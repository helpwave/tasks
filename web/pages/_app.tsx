import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  HightideProvider
} from '@helpwave/hightide'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'
import titleWrapper from '@/utils/titleWrapper'
import { getConfig } from '@/utils/config'
import '../globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { TasksContextProvider } from '@/hooks/useTasksContext'
import { ApolloProviderWithData } from '@/providers/ApolloProviderWithData'
import { ConflictProvider } from '@/providers/ConflictProvider'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { registerServiceWorker, requestNotificationPermission } from '@/utils/pushNotifications'
import { useEffect } from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
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
      <QueryClientProvider client={queryClient}>
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
          <ApolloProviderWithData>
            <SubscriptionProvider>
              <TasksContextProvider>
                <ConflictProvider>
                  <Component {...pageProps} />
                  <InstallPrompt />
                </ConflictProvider>
              </TasksContextProvider>
            </SubscriptionProvider>
          </ApolloProviderWithData>
        </AuthProvider>
        {config.env === 'development' && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </HightideProvider>
  )
}

export default MyApp
