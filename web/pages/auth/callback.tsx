'use client'

import { useEffect, useState } from 'react'
import { handleCallback } from '@/api/auth/authService'
import { useRouter, useSearchParams } from 'next/navigation'
import { SolidButton } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export default function AuthCallback() {
  const translation = useTasksTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasError, setHasError] = useState<boolean>(false)
  const [hasProcessed, setHasProcessed] = useState<boolean>(false)

  useEffect(() => {
    if (hasProcessed) {
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
          <span className="text-negative"> {translation('authenticationFailed')}</span>
          // TODO add more descriptive text here
        )}
        <SolidButton onClick={() => router.push('/')}>
          {translation('returnHome')}
        </SolidButton>
      </div>
    </div>
  )
}
