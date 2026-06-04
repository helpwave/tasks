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
  }, [pageData, pageIndex, loading])

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
