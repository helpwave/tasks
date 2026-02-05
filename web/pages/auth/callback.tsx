'use client'

import { useEffect, useRef, useState } from 'react'
import { handleCallback, invalidateRestoreSessionCache } from '@/api/auth/authService'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { HelpwaveLogo } from '@helpwave/hightide'

const REDIRECT_COOLDOWN_MS = 5000

export default function AuthCallback() {
  const translation = useTasksTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasError, setHasError] = useState<boolean>(false)
  const [hasProcessed, setHasProcessed] = useState<boolean>(false)
  const redirectTarget = useRef<string | null>(null)

  useEffect(() => {
    if (hasProcessed) return
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) return

    setHasProcessed(true)
    const redirect = searchParams.get('redirect_uri')
    const isValidRedirect = redirect && new URL(redirect).host === window.location.host
    redirectTarget.current = isValidRedirect ? redirect : '/'

    const run = async () => {
      try {
        await handleCallback()
        invalidateRestoreSessionCache()
      } catch {
        setHasError(true)
        redirectTarget.current = '/'
      }
    }
    run().catch(() => {})
  }, [searchParams, hasProcessed])

  useEffect(() => {
    if (!hasProcessed || redirectTarget.current === null) return
    const id = setTimeout(() => {
      router.push(redirectTarget.current ?? '/')
    }, REDIRECT_COOLDOWN_MS)
    return () => clearTimeout(id)
  }, [hasProcessed, router])

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface">
      <HelpwaveLogo
        animate="loading"
        color="currentColor"
        height={128}
        width={128}
      />
      {hasError && (
        <span className="mt-4 text-negative typography-body">
          {translation('authenticationFailed')}
        </span>
      )}
    </div>
  )
}
