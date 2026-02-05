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
  const [hasError, setHasError] = useState(false)
  const [hasProcessed, setHasProcessed] = useState(false)
  const redirectTarget = useRef<string>('/')

  useEffect(() => {
    if (hasProcessed) return
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) return

    setHasProcessed(true)

    const redirect = searchParams.get('redirect_uri')
    if (redirect) {
      try {
        const url = new URL(redirect)
        redirectTarget.current = url.host === window.location.host ? url.pathname + url.search + url.hash : '/'
      } catch {
        redirectTarget.current = '/'
      }
    } else {
      redirectTarget.current = '/'
    }

    ; (async () => {
      try {
        await handleCallback()
        invalidateRestoreSessionCache()
        router.replace(redirectTarget.current)
      } catch {
        setHasError(true)
      }
    })().catch(() => { })
  }, [searchParams, hasProcessed, router])

  useEffect(() => {
    if (!hasProcessed || !hasError) return
    const id = setTimeout(() => {
      router.replace('/')
    }, REDIRECT_COOLDOWN_MS)
    return () => clearTimeout(id)
  }, [hasProcessed, hasError, router])

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface">
      <HelpwaveLogo animate="loading" color="currentColor" height={128} width={128} />
      {hasError && (
        <span className="mt-4 text-negative typography-body">
          {translation('authenticationFailed')}
        </span>
      )}
    </div>
  )
}
