import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_PREFETCH_PAGES = 2

/**
 * Pure derivation of the pagination boundaries. Kept separate so the
 * "stop at the end" logic can be unit-tested without rendering the hook.
 *
 * `lastAvailablePage` is the highest page index that still maps onto real data;
 * fetching beyond it only yields empty pages (offset past the total), which is
 * what previously kept the infinite-scroll sentinel looping forever.
 */
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
  // When more pages were already accumulated, keep the tail and only refresh the
  // leading page so a page-0 background refetch never shrinks the visible list.
  if (incoming.length === 0) return prev
  if (prev.length <= incoming.length) return incoming
  const incomingIds = new Set(incoming.map(x => x.id))
  const tail = prev.filter(item => !incomingIds.has(item.id))
  return [...incoming, ...tail]
}

export function useAccumulatedPagination<T extends { id: string }>(options: {
  resetKey: string,
  pageData: T[] | undefined,
  pageIndex: number,
  setPageIndex: React.Dispatch<React.SetStateAction<number>>,
  totalCount: number | undefined,
  loading: boolean,
  pageSize: number,
  /** Warms the cache for upcoming pages so scrolling stays instant. */
  prefetchPage?: (pageIndex: number) => void,
  /** How many pages ahead to keep ready. Defaults to 2. */
  prefetchPages?: number,
}): {
  accumulated: T[],
  loadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
} {
  const {
    resetKey, pageData, pageIndex, setPageIndex, totalCount, loading,
    pageSize, prefetchPage, prefetchPages = DEFAULT_PREFETCH_PAGES,
  } = options
  const [accumulated, setAccumulated] = useState<T[]>([])
  const prevResetKeyRef = useRef(resetKey)

  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey
      setPageIndex(0)
      setAccumulated([])
    }
  }, [resetKey, setPageIndex])

  useEffect(() => {
    if (pageData === undefined || loading) return
    if (pageIndex === 0) {
      // Reconcile the first page in place so unchanged rows keep their position
      // and the table is not remounted on every background refetch.
      setAccumulated(prev => reconcileFirstPage(prev, pageData))
      return
    }
    setAccumulated(prev => {
      const ids = new Set(prev.map(x => x.id))
      const next = [...prev]
      for (const item of pageData) {
        if (!ids.has(item.id)) next.push(item)
      }
      return next
    })
  }, [pageData, pageIndex, loading])

  // `lastAvailablePage` is the highest page index that still maps onto real data;
  // `hasMore` is true only when more rows are expected *and* a further page
  // exists to fetch. Gating on the page index keeps us from offering "Load more"
  // (or auto-loading) when the visible list is empty but a stale total still
  // claims rows exist.
  const { lastAvailablePage, hasMore } = useMemo(
    () => computePaginationBounds({
      totalCount,
      pageSize,
      pageIndex,
      accumulatedLength: accumulated.length,
    }),
    [totalCount, pageSize, pageIndex, accumulated.length]
  )

  // Recover from an out-of-range page index. When the result set shrinks while a
  // later page is selected (e.g. switching to a custom view with fewer rows),
  // the active query would otherwise keep requesting empty pages past the end,
  // never growing `accumulated`, leaving `hasMore` permanently true and spinning
  // the infinite-scroll sentinel in a loading loop.
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
