import { useCallback, useEffect, useRef, useState } from 'react'

export function useAccumulatedPagination<T extends { id: string }>(options: {
  resetKey: string,
  pageData: T[] | undefined,
  pageIndex: number,
  setPageIndex: React.Dispatch<React.SetStateAction<number>>,
  totalCount: number | undefined,
  loading: boolean,
}): {
  accumulated: T[],
  loadMore: () => void,
  hasMore: boolean,
} {
  const { resetKey, pageData, pageIndex, setPageIndex, totalCount, loading } = options
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
      setAccumulated(pageData)
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

  const loadMore = useCallback(() => {
    setPageIndex(i => i + 1)
  }, [setPageIndex])

  const hasMore = totalCount != null && accumulated.length < totalCount

  return { accumulated, loadMore, hasMore }
}
