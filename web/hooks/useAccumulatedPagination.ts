import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_PREFETCH_PAGES = 2

export function computePaginationBounds(options: {
  totalCount: number | undefined,
  pageSize: number,
  pageIndex: number,
  accumulatedLength: number,
}): {
  lastAvailablePage: number | undefined,
  hasMore: boolean,
} {
  const { totalCount, pageSize, pageIndex, accumulatedLength } = options
  const lastAvailablePage = (totalCount == null || pageSize <= 0)
    ? undefined
    : Math.max(0, Math.ceil(totalCount / pageSize) - 1)
  const hasMore = totalCount != null
    && accumulatedLength < totalCount
    && (lastAvailablePage == null || pageIndex < lastAvailablePage)
  return { lastAvailablePage, hasMore }
}

function reconcileFirstPage<T extends { id: string }>(prev: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return prev
  if (prev.length <= incoming.length) return incoming
  const incomingIds = new Set(incoming.map(x => x.id))
  const tail = prev.filter(item => !incomingIds.has(item.id))
  return [...incoming, ...tail]
}

function sameItems<T extends { id: string }>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function mergePagesById<T extends { id: string }>(
  pages: ReadonlyArray<readonly T[] | undefined>
): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  for (const page of pages) {
    if (!page) continue
    for (const item of page) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        out.push(item)
      }
    }
  }
  return out
}

/**
 * Merges the per-page reads into a single accumulated list while remembering the
 * last non-empty result for each page in `lastPages`. A page that reads as
 * `undefined` (momentarily unreadable, e.g. while a refetch is in flight) falls
 * back to its previously known items instead of disappearing — this keeps
 * infinite scroll as one continuous list rather than collapsing to the latest
 * page. A defined-but-empty read is authoritative and clears the remembered
 * page so genuine removals still propagate.
 */
export function materializePages<T extends { id: string }>(
  rawReads: ReadonlyArray<readonly T[] | undefined>,
  lastPages: Map<number, T[]>
): T[] {
  const pages: Array<readonly T[] | undefined> = rawReads.map((read, page) => {
    if (read === undefined) {
      return lastPages.get(page)
    }
    if (read.length > 0) {
      lastPages.set(page, read as T[])
    } else {
      lastPages.delete(page)
    }
    return read
  })
  return mergePagesById(pages)
}

export function useAccumulatedPagination<T extends { id: string }>(options: {
  resetKey: string,
  pageData: T[] | undefined,
  pageIndex: number,
  setPageIndex: React.Dispatch<React.SetStateAction<number>>,
  totalCount: number | undefined,
  loading: boolean,
  pageSize: number,
  prefetchPage?: (pageIndex: number) => void,
  prefetchPages?: number,
  readCachedPage?: (pageIndex: number) => T[] | undefined,
  watchCachedPage?: (pageIndex: number, onChange: () => void) => () => void,
}): {
  accumulated: T[],
  loadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
} {
  const {
    resetKey, pageData, pageIndex, setPageIndex, totalCount, loading,
    pageSize, prefetchPage, prefetchPages = DEFAULT_PREFETCH_PAGES,
    readCachedPage, watchCachedPage,
  } = options
  const [accumulated, setAccumulated] = useState<T[]>([])
  const prevResetKeyRef = useRef(resetKey)
  const cacheBacked = !!readCachedPage && !!watchCachedPage

  const pageDataRef = useRef(pageData)
  pageDataRef.current = pageData

  // Remembers the last non-empty items materialized for each loaded page so that a
  // transient cache miss (e.g. a page that is momentarily unreadable while a
  // refetch is in flight) never drops already-loaded rows. Without this the
  // accumulated list could collapse to just the current page, making infinite
  // scroll look like it "turned the page" instead of appending to one list.
  const lastPagesRef = useRef<Map<number, T[]>>(new Map())

  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey
      lastPagesRef.current.clear()
      setPageIndex(0)
      setAccumulated([])
    }
  }, [resetKey, setPageIndex])

  useEffect(() => {
    if (!cacheBacked || !readCachedPage || !watchCachedPage) return
    const materialize = () => {
      const rawReads: Array<T[] | undefined> = []
      for (let p = 0; p <= pageIndex; p++) {
        rawReads.push(readCachedPage(p) ?? (p === pageIndex ? pageDataRef.current : undefined))
      }
      const next = materializePages(rawReads, lastPagesRef.current)
      setAccumulated(prev => (sameItems(prev, next) ? prev : next))
    }
    materialize()
    const unsubscribes: Array<() => void> = []
    for (let p = 0; p <= pageIndex; p++) {
      unsubscribes.push(watchCachedPage(p, materialize))
    }
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [cacheBacked, readCachedPage, watchCachedPage, pageIndex])

  useEffect(() => {
    if (cacheBacked) return
    if (pageData === undefined || loading) return
    if (pageIndex === 0) {
      setAccumulated(prev => reconcileFirstPage(prev, pageData))
      return
    }
    setAccumulated(prev => {
      const incomingById = new Map(pageData.map(item => [item.id, item]))
      const existingIds = new Set(prev.map(item => item.id))
      const next = prev.map(item => incomingById.get(item.id) ?? item)
      for (const item of pageData) {
        if (!existingIds.has(item.id)) next.push(item)
      }
      return next
    })
  }, [cacheBacked, pageData, pageIndex, loading])

  const { lastAvailablePage, hasMore } = useMemo(
    () => computePaginationBounds({
      totalCount,
      pageSize,
      pageIndex,
      accumulatedLength: accumulated.length,
    }),
    [totalCount, pageSize, pageIndex, accumulated.length]
  )

  useEffect(() => {
    if (lastAvailablePage == null) return
    if (pageIndex > lastAvailablePage) {
      setPageIndex(lastAvailablePage)
    }
  }, [lastAvailablePage, pageIndex, setPageIndex])

  const isFetchingMore = loading && pageIndex > 0

  const loadMore = useCallback(() => {
    setPageIndex(i => (lastAvailablePage != null && i >= lastAvailablePage ? i : i + 1))
  }, [setPageIndex, lastAvailablePage])

  const lastLoadedPage = useMemo(() => {
    if (pageSize <= 0) return pageIndex
    return Math.max(pageIndex, Math.ceil(accumulated.length / pageSize) - 1)
  }, [pageIndex, accumulated.length, pageSize])

  useEffect(() => {
    if (!prefetchPage || loading || lastAvailablePage == null) return
    for (let i = 1; i <= prefetchPages; i++) {
      const target = lastLoadedPage + i
      if (target > lastAvailablePage) break
      prefetchPage(target)
    }
  }, [prefetchPage, prefetchPages, lastLoadedPage, lastAvailablePage, loading])

  return { accumulated, loadMore, hasMore, isFetchingMore }
}
