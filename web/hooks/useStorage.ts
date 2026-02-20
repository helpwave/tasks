import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

export type UseStorageOptions<T> = {
  key: string,
  defaultValue: T,
  serialize?: (value: T) => string,
  deserialize?: (raw: string) => T,
}

export type UseStorageResult<T> = {
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
}

function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value)
}

function defaultDeserialize<T>(raw: string): T {
  return JSON.parse(raw) as T
}

export function useStorage<T>(options: UseStorageOptions<T>): UseStorageResult<T> {
  const {
    key,
    defaultValue,
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
  } = options

  const [value, setValueState] = useState<T>(defaultValue)
  const defaultValueRef = useRef(defaultValue)
  const deserializeRef = useRef(deserialize)
  defaultValueRef.current = defaultValue
  deserializeRef.current = deserialize

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        setValueState(deserializeRef.current(raw))
      }
    } catch {
      setValueState(defaultValueRef.current)
    }
  }, [key])

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      setValueState((prev) => {
        const next = typeof action === 'function' ? (action as (prev: T) => T)(prev) : action
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, serialize(next))
          } catch {
            // ignore storage errors
          }
        }
        return next
      })
    },
    [key, serialize]
  )

  return { value, setValue }
}
