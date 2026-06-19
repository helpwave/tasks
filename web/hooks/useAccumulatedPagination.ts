import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { samePaginatedListItems } from '@/utils/paginatedListItemKey'

export function computePaginationBounds(options: {
  totalCount: number | undefined,
  pageSize: number,
  pageIndex: number,
  accumulatedLength: number,
  contiguousLoadedThrough?: number,
}): {
  lastAvailablePage: number | undefined,
  hasMore: boolean,
} {
  const { totalCount, pageSize, pageIndex, accumulatedLength, contiguousLoadedThrough } = options
  const lastAvailablePage = (totalCount == null || pageSize <= 0)
    ? undefined
    : Math.max(0, Math.ceil(totalCount / pageSize) - 1)
  const hasGap = contiguousLoadedThrough != null && contiguousLoadedThrough < pageIndex
  const withinBounds = lastAvailablePage == null || pageIndex <= lastAvailablePage
  const initialPageReady = contiguousLoadedThrough == null || contiguousLoadedThrough >= 0
  const hasMore = totalCount != null
    && accumulatedLength < totalCount
    && withinBounds
    && initialPageReady
    && (hasGap || lastAvailablePage == null || pageIndex < lastAvailablePage)
  return { lastAvailablePage, hasMore }
}

export function resolveAccumulatedList<T extends { id: string }>(options: {
  accumulated: T[],
  pageIndex: number,
  pageData: T[] | undefined,
  readCachedPage0?: () => T[] | undefined,
}): T[] {
  const { accumulated, pageIndex, pageData, readCachedPage0 } = options
  if (accumulated.length > 0) return accumulated
  if (pageIndex === 0 && pageData && pageData.length > 0) return pageData
  const cachedPage0 = readCachedPage0?.()
  if (cachedPage0 && cachedPage0.length > 0) return cachedPage0
  return accumulated
}

function reconcileFirstPage<T extends { id: string }>(prev: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return prev
  if (prev.length <= incoming.length) return incoming
  const incomingIds = new Set(incoming.map(x => x.id))
  const tail = prev.filter(item => !incomingIds.has(item.id))
  return [...incoming, ...tail]
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

export function mergePagesContiguousById<T extends { id: string }>(
  pages: ReadonlyArray<readonly T[] | undefined>
): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  for (const page of pages) {
    if (!page) break
    for (const item of page) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        out.push(item)
      }
    }
  }
  return out
}

export function getContiguousLoadedThrough<T>(
  upTo: number,
  readPage: (pageIndex: number) => T[] | undefined
): number {
  let through = -1
  for (let p = 0; p <= upTo; p++) {
    if (readPage(p) === undefined) break
    through = p
  }
  return through
}

/**
 * Merges the per-page reads into a single accumulated list while remembering the
 * last non-empty result for each page in `lastPages`. A page that reads as
 * `undefined` (momentarily unreadable, e.g. while a refetch is in flight) falls
 * back to its previously known items instead of disappearing — this keeps
 * infinite scroll as one continuous list rather than collapsing to the latest
 * page. A defined-but-empty read is authoritative and clears the remembered
 * page so genuine removals still propagate, unless totalCount indicates rows
 * should still exist and the page was previously populated (transient incomplete
 * cache read).
 */
export function materializePages<T extends { id: string }>(
  rawReads: ReadonlyArray<readonly T[] | undefined>,
  lastPages: Map<number, T[]>,
  totalCount?: number
): T[] {
  const pages: Array<readonly T[] | undefined> = rawReads.map((read, page) => {
    if (read === undefined) {
      return lastPages.get(page)
    }
    if (read.length > 0) {
      lastPages.set(page, read as T[])
      return read
    }
    const previous = lastPages.get(page)
    if (previous && previous.length > 0 && totalCount != null && totalCount > 0) {
      return previous
    }
    lastPages.delete(page)
    return read
  })
  return mergePagesContiguousById(pages)
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
  readCachedPage?: (pageIndex: number) => T[] | undefined,
  watchCachedPage?: (pageIndex: number, onChange: () => void) => () => void,
}): {
  accumulated: T[],
  loadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
  isInitialPageReady: boolean,
} {
  const {
    resetKey, pageData, pageIndex, setPageIndex, totalCount, loading,
    pageSize, prefetchPage, readCachedPage, watchCachedPage,
  } = options
  const [accumulated, setAccumulated] = useState<T[]>([])
  const [contiguousLoadedThrough, setContiguousLoadedThrough] = useState(-1)
  const prevResetKeyRef = useRef(resetKey)
  const cacheBacked = !!readCachedPage && !!watchCachedPage

  const pageDataRef = useRef(pageData)
  pageDataRef.current = pageData

  const lastPagesRef = useRef<Map<number, T[]>>(new Map())
  const totalCountRef = useRef(totalCount)
  totalCountRef.current = totalCount

  const resolvePageRead = useCallback((page: number): T[] | undefined => {
    const read = readCachedPage?.(page) ?? (page === pageIndex ? pageDataRef.current : undefined)
    if (read !== undefined) {
      if (read.length > 0) {
        lastPagesRef.current.set(page, read)
        return read
      }
      const previous = lastPagesRef.current.get(page)
      const knownTotal = totalCountRef.current
      if (previous && previous.length > 0 && knownTotal != null && knownTotal > 0) {
        return previous
      }
      lastPagesRef.current.delete(page)
      return read
    }
    return lastPagesRef.current.get(page)
  }, [readCachedPage, pageIndex])

  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey
      lastPagesRef.current.clear()
      setContiguousLoadedThrough(-1)
      setPageIndex(0)
      setAccumulated([])
    }
  }, [resetKey, setPageIndex])

  useEffect(() => {
    if (!cacheBacked || !readCachedPage || !watchCachedPage) return
    const materialize = () => {
      const rawReads: Array<T[] | undefined> = []
      for (let p = 0; p <= pageIndex; p++) {
        rawReads.push(resolvePageRead(p))
      }
      const next = materializePages(rawReads, lastPagesRef.current, totalCountRef.current)
      const through = getContiguousLoadedThrough(pageIndex, resolvePageRead)
      setContiguousLoadedThrough(through)
      setAccumulated(prev => (samePaginatedListItems(prev, next) ? prev : next))
    }
    materialize()
    const unsubscribes: Array<() => void> = []
    for (let p = 0; p <= pageIndex; p++) {
      unsubscribes.push(watchCachedPage(p, materialize))
    }
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [cacheBacked, readCachedPage, watchCachedPage, pageIndex, resolvePageRead])

  useEffect(() => {
    if (cacheBacked) return
    if (pageData === undefined || loading) return
    if (pageIndex === 0) {
      setContiguousLoadedThrough(0)
      setAccumulated(prev => reconcileFirstPage(prev, pageData))
      return
    }
    setAccumulated(prev => {
      if (prev.length === 0) return prev
      const incomingById = new Map(pageData.map(item => [item.id, item]))
      const existingIds = new Set(prev.map(item => item.id))
      const next = prev.map(item => incomingById.get(item.id) ?? item)
      for (const item of pageData) {
        if (!existingIds.has(item.id)) next.push(item)
      }
      return next
    })
    setContiguousLoadedThrough(pageIndex)
  }, [cacheBacked, pageData, pageIndex, loading])

  const { lastAvailablePage, hasMore } = useMemo(
    () => computePaginationBounds({
      totalCount,
      pageSize,
      pageIndex,
      accumulatedLength: accumulated.length,
      contiguousLoadedThrough,
    }),
    [totalCount, pageSize, pageIndex, accumulated.length, contiguousLoadedThrough]
  )

  useEffect(() => {
    if (lastAvailablePage == null) return
    if (pageIndex > lastAvailablePage) {
      setPageIndex(lastAvailablePage)
    }
  }, [lastAvailablePage, pageIndex, setPageIndex])

  const accumulatedResolved = useMemo(
    () => resolveAccumulatedList({
      accumulated,
      pageIndex,
      pageData,
      readCachedPage0: readCachedPage ? () => readCachedPage(0) : undefined,
    }),
    [accumulated, pageData, pageIndex, readCachedPage]
  )

  const isInitialPageReady = contiguousLoadedThrough >= 0

  const isFetchingMore = loading && pageIndex > 0

  const loadMore = useCallback(() => {
    setPageIndex(i => {
      if (lastAvailablePage != null && i >= lastAvailablePage) return i
      if (contiguousLoadedThrough < i) return i
      return i + 1
    })
  }, [setPageIndex, lastAvailablePage, contiguousLoadedThrough])

  useEffect(() => {
    if (!prefetchPage || totalCount == null || totalCount <= 0) return
    if (contiguousLoadedThrough >= 0) return
    prefetchPage(0)
  }, [prefetchPage, totalCount, contiguousLoadedThrough])

  useEffect(() => {
    if (!prefetchPage || loading || lastAvailablePage == null) return
    if (contiguousLoadedThrough < 0) return
    const nextPage = contiguousLoadedThrough + 1
    if (nextPage > lastAvailablePage) return
    prefetchPage(nextPage)
  }, [prefetchPage, contiguousLoadedThrough, lastAvailablePage, loading])

  return { accumulated: accumulatedResolved, loadMore, hasMore, isFetchingMore, isInitialPageReady }
}
