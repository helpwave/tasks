'use client'

import { useEffect, useRef, useState } from 'react'
import { handleCallback } from '@/api/auth/authService'
import { useRouter, useSearchParams } from 'next/navigation'
import { SolidButton, LoadingAnimation } from '@helpwave/hightide'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const processed = useRef(false)

  useEffect(() => {
    const processCallback = async () => {
      if (processed.current) return

      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (code && state) {
        processed.current = true
        console.debug('Processing OIDC callback...')

        try {
          const user = await handleCallback()
          type UserState = { returnUrl?: string };

          const state = user.state as UserState | undefined
          const returnUrl = state?.returnUrl ?? '/'

          console.info(`Login success. Redirecting to: ${returnUrl}`)
          router.replace(returnUrl)

        } catch (err) {
          console.error('OIDC callback error:', err)
          setError('Authentication failed. Please try again.')
          processed.current = false
        }
      }
    }

    processCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="text-red-500 font-bold">{error}</span>
        <SolidButton onClick={() => router.push('/')}>Return to Home</SolidButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen">
      <LoadingAnimation loadingText="Finalizing login..." />
    </div>
  )
}
