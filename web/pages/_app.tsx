import Head from 'next/head'
import type { AppProps } from 'next/app'
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  LocaleProvider,
  ThemeProvider
} from '@helpwave/hightide'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'
import titleWrapper from '@/utils/titleWrapper'
import { getConfig } from '@/utils/config'
import '../globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { TasksContextProvider } from '@/hooks/useTasksContext'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

const queryClient = new QueryClient()

const config = getConfig()

function MyApp({
  Component,
  pageProps
}: AppProps) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Head>
            <title>{titleWrapper()}</title>
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
                        <Component {...pageProps} />
                        <InstallPrompt />
                      </TasksContextProvider>
                    </AuthProvider>
                    {config.env === 'development' && <ReactQueryDevtools position="bottom-left" />}
                </QueryClientProvider>
            </ThemeProvider>
        </LocaleProvider>
    )
}

export default MyApp
