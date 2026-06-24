'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export function useIsPrinting(): boolean {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const setSync = (value: boolean) => {
      try {
        flushSync(() => setIsPrinting(value))
      } catch {
        setIsPrinting(value)
      }
    }

    const handleBeforePrint = () => setSync(true)
    const handleAfterPrint = () => setSync(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    const mediaQuery = window.matchMedia?.('print')
    const handleChange = (event: MediaQueryListEvent) => setSync(event.matches)
    mediaQuery?.addEventListener?.('change', handleChange)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
      mediaQuery?.removeEventListener?.('change', handleChange)
    }
  }, [])

  return isPrinting
}
