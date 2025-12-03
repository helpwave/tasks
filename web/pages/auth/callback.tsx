'use client'

import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { handleCallback } from '@/api/auth/authService'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { SolidButton } from '@helpwave/hightide'

type AuthCallbackServerSideProps = {
  jsonFeed: unknown,
}

const AuthCallback: NextPage<AuthCallbackServerSideProps> = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    const checkAuthCallback = async () => {
      if (searchParams.get('code') && searchParams.get('state')) {
        console.debug('Processing OIDC callback...')
        try {
          await handleCallback()
          const redirect = searchParams.get('redirect_uri')
          const isValidRedirect = redirect && new URL(redirect).host === window.location.host
          const defaultRedirect = '/'
          if (!isValidRedirect) {
            console.warn(`Redirect URL is invalid, redirecting to default route ${defaultRedirect}`)
            await router.push(defaultRedirect)
          } else {
            console.info(`Redirecting to ${redirect ?? defaultRedirect}`)
            await router.push(redirect ?? defaultRedirect)
          }
        } catch (error) {
          console.error('OIDC callback error:', error)
          setHasError(true)
        }
      }
    }

    checkAuthCallback().catch(console.error)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {hasError && (
        <span className="text-negative">Auth failed</span>
      )}
      <SolidButton onClick={() => router.push('/')}>Take me home.</SolidButton>
    </div>
  )
}

export default AuthCallback
