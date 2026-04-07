import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, startTransition } from 'react'
import type { ColumnOrderState } from '@tanstack/table-core'

export function useDeferredColumnOrderChange(
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>
): Dispatch<SetStateAction<ColumnOrderState>> {
  const mountedRef = useRef(false)
  const pendingRef = useRef<SetStateAction<ColumnOrderState>[]>([])

  useEffect(() => {
    mountedRef.current = true
    const pending = pendingRef.current
    pendingRef.current = []
    for (const u of pending) {
      startTransition(() => {
        setColumnOrder(u)
      })
    }
    return () => {
      mountedRef.current = false
      pendingRef.current = []
    }
  }, [setColumnOrder])

  return useCallback(
    (updater: SetStateAction<ColumnOrderState>) => {
      if (typeof window === 'undefined') {
        return
      }
      if (!mountedRef.current) {
        pendingRef.current.push(updater)
        return
      }
      window.setTimeout(() => {
        if (!mountedRef.current) {
          return
        }
        startTransition(() => {
          setColumnOrder(updater)
        })
      }, 0)
    },
    [setColumnOrder]
  )
}
