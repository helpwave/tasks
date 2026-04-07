import { useRef } from 'react'

export function useStableSerializedList<T>(
  list: readonly T[] | undefined | null,
  serializeItem: (item: T) => unknown
): T[] | undefined {
  const ref = useRef<{ key: string, list: T[] | undefined }>({ key: '', list: undefined })
  if (!list?.length) {
    ref.current = { key: '', list: undefined }
    return undefined
  }
  const key = JSON.stringify(list.map(serializeItem))
  if (ref.current.key === key) {
    return ref.current.list
  }
  const next = [...list] as T[]
  ref.current = { key, list: next }
  return next
}
