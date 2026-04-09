import { useEffect, useRef } from 'react'
import type { FormStore, FormValue } from '@helpwave/hightide'

const BASELINE_CAPTURE_MS = 250

type UseCreateDraftDirtyParams<T extends FormValue> = {
  enabled: boolean,
  store: FormStore<T>,
  serialize: (values: T) => string,
  onDirtyChange?: (dirty: boolean) => void,
}

export function useCreateDraftDirty<T extends FormValue>({
  enabled,
  store,
  serialize,
  onDirtyChange,
}: UseCreateDraftDirtyParams<T>): void {
  const baselineRef = useRef<string | null>(null)
  const baselineReadyRef = useRef(false)

  useEffect(() => {
    if (!enabled || !onDirtyChange) {
      onDirtyChange?.(false)
      baselineRef.current = null
      baselineReadyRef.current = false
      return
    }

    onDirtyChange(false)
    baselineReadyRef.current = false
    baselineRef.current = null

    const captureBaseline = (): void => {
      const snapshot = serialize(store.getAllValues())
      baselineRef.current = snapshot
      baselineReadyRef.current = true
      onDirtyChange(serialize(store.getAllValues()) !== baselineRef.current)
    }

    const timerId = window.setTimeout(captureBaseline, BASELINE_CAPTURE_MS)

    const unsub = store.subscribe('ALL', () => {
      if (!baselineReadyRef.current || baselineRef.current === null) {
        return
      }
      onDirtyChange(serialize(store.getAllValues()) !== baselineRef.current)
    })

    return () => {
      window.clearTimeout(timerId)
      unsub()
      baselineReadyRef.current = false
      baselineRef.current = null
    }
  }, [enabled, store, serialize, onDirtyChange])
}
