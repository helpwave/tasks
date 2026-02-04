import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryWhenReady } from './queryHelpers'

export type UsePaginatedEntityQueryOptions<TQueryData> = {
  pageSize: number,
  getPageDataKey?: (data: TQueryData | undefined) => string,
}

export type UsePaginatedEntityQueryResult<TItem> = {
  data: TItem[],
  loading: boolean,
  error: Error | undefined,
  fetchNextPage: () => void,
  hasNextPage: boolean,
  totalCount: number | undefined,
  refetch: () => void,
}

export function usePaginatedEntityQuery<
  TQueryData,
  TVariables extends Record<string, unknown>,
  TItem
>(
  document: Parameters<typeof useQueryWhenReady<TQueryData, TVariables & { pagination: { pageIndex: number, pageSize: number } }>>[0],
  variables: TVariables | undefined,
  options: UsePaginatedEntityQueryOptions<TQueryData>,
  extractItems: (data: TQueryData | undefined) => TItem[],
  extractTotal: (data: TQueryData | undefined) => number | undefined
): UsePaginatedEntityQueryResult<TItem> {
  const { pageSize, getPageDataKey } = options
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<(TQueryData | undefined)[]>([])
  const variablesWithPagination = useMemo(() => ({
    ...(variables ?? {}),
    pagination: { pageIndex, pageSize }
  }), [variables, pageIndex, pageSize])
  const variablesWithPaginationTyped = variablesWithPagination as TVariables & { pagination: { pageIndex: number, pageSize: number } }
  const variablesKey = useMemo(
    () => JSON.stringify(variablesWithPagination),
    [variablesWithPagination]
  )
  const result = useQueryWhenReady<TQueryData, TVariables & { pagination: { pageIndex: number, pageSize: number } }>(
    document,
    variablesWithPaginationTyped,
    { fetchPolicy: 'cache-and-network' }
  )
  const totalCount = extractTotal(result.data)
  const prevDataKeyRef = useRef<string>('')
  const variablesKeyRef = useRef<string>('')

  useEffect(() => {
    if (variablesKey !== variablesKeyRef.current) {
      variablesKeyRef.current = variablesKey
      prevDataKeyRef.current = ''
    }
    if (result.loading || result.data === undefined) return
    if (getPageDataKey) {
      const dataKey = getPageDataKey(result.data)
      if (prevDataKeyRef.current === dataKey) return
      prevDataKeyRef.current = dataKey
    }
    setPages((prev) => {
      const next = [...prev]
      next[pageIndex] = result.data
      return next
    })
  }, [result.loading, result.data, pageIndex, variablesKey, getPageDataKey])

  const flattened = useMemo(() => {
    const currentFromCache = !result.loading ? result.data : undefined
    const before = pages.slice(0, pageIndex).flatMap((p) => extractItems(p))
    const current = currentFromCache !== undefined ? extractItems(currentFromCache) : extractItems(pages[pageIndex])
    const after = pages.slice(pageIndex + 1).flatMap((p) => extractItems(p))
    return [...before, ...current, ...after]
  }, [pageIndex, pages, result.data, result.loading, extractItems])

  const hasNextPage =
    (totalCount !== undefined && flattened.length < totalCount) ?? false

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !result.loading) {
      setPageIndex((i) => i + 1)
    }
  }, [hasNextPage, result.loading])

  const refetch = useCallback(() => {
    result.refetch()
  }, [result])

  return {
    data: flattened,
    loading: result.loading,
    error: result.error,
    fetchNextPage,
    hasNextPage,
    totalCount,
    refetch,
  }
}
