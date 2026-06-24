'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

/**
 * Tracks whether the document is currently being printed.
 *
 * This exists so row virtualization can be turned off while printing: a windowed table only mounts
 * the rows near the viewport, but a printout must contain every row. The state change is flushed
 * synchronously on `beforeprint` so the full (non-virtualized) table is in the DOM before the
 * browser captures the print layout, and restored on `afterprint`. `matchMedia('print')` is used as
 * a fallback for browsers/paths that don't fire the print events.
 */
export function useIsPrinting(): boolean {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const setSync = (value: boolean) => {
      // flushSync forces a synchronous re-render so the DOM reflects the (non-)virtualized layout
      // before the browser paints the print preview. It throws if called mid-render, hence the guard.
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
