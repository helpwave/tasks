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
  const [hasProcessed, setHasProcessed] = useState<boolean>(false)

  useEffect(() => {
    if(hasProcessed) {
      return
    }
    const checkAuthCallback = async () => {
      if (searchParams.get('code') && searchParams.get('state')) {
        setHasProcessed(true)
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
    <div className="flex-col-0 justify-center items-center w-screen h-screen">
      <div className="flex-col-2 max-w-64">
        {hasError && (
          <span className="text-negative">Authentication failed</span>
          // TODO add more descriptive text here
        )}
        <SolidButton onClick={() => router.push('/')}>Take me home.</SolidButton>
      </div>
    </div>
  )
}

export default AuthCallback
