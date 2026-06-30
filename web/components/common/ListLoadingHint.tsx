'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

const MESSAGE_KEYS = ['loadingHangOn', 'loadingMoment', 'loadingAlmostThere', 'loadingGettingReady'] as const

type ListLoadingHintProps = {
  active: boolean,
  className?: string,
}

export function ListLoadingHint({ active, className }: ListLoadingHintProps) {
  const translation = useTasksTranslation()
  const [messageIndex, setMessageIndex] = useState(0)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setMessageIndex((index) => (index + 1) % MESSAGE_KEYS.length)
    }
    wasActiveRef.current = active
  }, [active])

  if (!active) return null

  const messageKey = MESSAGE_KEYS[messageIndex] ?? MESSAGE_KEYS[0]

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'absolute inset-x-3 bottom-3 z-10 rounded-lg p-2 flex items-center justify-center gap-2 py-3 text-sm text-description pointer-events-none print:hidden',
        'bg-linear-to-t from-background via-background/90 to-transparent',
        className
      )}
    >
      <Loader2 className="size-4 animate-spin"/>
      <span>{translation(messageKey)}</span>
    </div>
  )
}
