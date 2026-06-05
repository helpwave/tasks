import { useCallback, useEffect, useState } from 'react'

export type ListLayout = 'table' | 'card'

export const LIST_LAYOUT_STORAGE_PREFIX = 'helpwave.tasks.listLayout:'

export type ListLayoutEntity = 'tasks' | 'patients'

/**
 * Returns the default layout for a fresh device: cards on small (mobile)
 * viewports, table on larger ones. Mirrors the previous inline behaviour.
 */
export const getDefaultListLayout = (): ListLayout => (
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 'card' : 'table'
)

/** Validates a raw localStorage value, returning null when it is not a known layout. */
export const parseStoredLayout = (raw: string | null | undefined): ListLayout | null => (
  raw === 'table' || raw === 'card' ? raw : null
)

/**
 * Picks the identifier that distinguishes one view from another on the same
 * route. Saved-view ids win, then dynamic route params (`uid`, `id`), falling
 * back to a shared `root` bucket for plain routes like `/tasks`.
 */
export const resolveListRouteId = (
  query: Record<string, string | string[] | undefined>,
  preferred?: string
): string => {
  if (preferred) return preferred
  const uid = query['uid']
  if (typeof uid === 'string' && uid) return uid
  const id = query['id']
  if (typeof id === 'string' && id) return id
  return 'root'
}

/**
 * Builds the per-view/route storage key, or `null` when persistence is
 * disabled (e.g. embedded lists whose layout is forced).
 */
export const buildListLayoutStorageKey = (params: {
  entity: ListLayoutEntity,
  disabled: boolean,
  pathname: string,
  routeId: string,
}): string | null => {
  if (params.disabled) return null
  return `${params.entity}:${params.pathname}:${params.routeId}`
}

const readStoredLayout = (storageKey: string | null): ListLayout | null => {
  if (!storageKey || typeof window === 'undefined') return null
  try {
    return parseStoredLayout(window.localStorage.getItem(LIST_LAYOUT_STORAGE_PREFIX + storageKey))
  } catch {
    // localStorage can be unavailable (privacy mode, quota) - fall back to default.
    return null
  }
}

/**
 * Persists the table/card layout toggle per view/route on the current device.
 *
 * The `storageKey` should uniquely identify the list within its route (build it
 * via {@link buildListLayoutStorageKey}). Pass `null` to disable persistence.
 */
export const useListLayoutPreference = (storageKey: string | null) => {
  const [layout, setLayoutState] = useState<ListLayout>(getDefaultListLayout)

  // Hydrate from localStorage on the client once the key is known. Done in an
  // effect (not the initializer) to keep server/client first render identical.
  useEffect(() => {
    const stored = readStoredLayout(storageKey)
    if (stored) {
      setLayoutState(stored)
    }
  }, [storageKey])

  const setLayout = useCallback((next: ListLayout) => {
    setLayoutState(next)
    if (storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LIST_LAYOUT_STORAGE_PREFIX + storageKey, next)
      } catch {
        // Ignore write failures (e.g. storage disabled or quota exceeded).
      }
    }
  }, [storageKey])

  return [layout, setLayout] as const
}
