import { useCallback, useMemo, useRef } from 'react'
import { useQueryWhenReady, getParsedDocument } from './queryHelpers'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'
import type { QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput } from '@/api/gql/generated'

export type UsePaginatedEntityQueryOptions<TQueryData> = {
  pagination: { pageIndex: number, pageSize: number },
  sorts?: QuerySortClauseInput[],
  filters?: QueryFilterClauseInput[],
  search?: QuerySearchInput,
  getPageDataKey?: (data: TQueryData | undefined) => string,
  skip?: boolean,
}

export type UsePaginatedEntityQueryResult<TItem> = {
  data: TItem[],
  loading: boolean,
  error: Error | undefined,
  totalCount: number | undefined,
  refetch: () => void,
  prefetchPage: (pageIndex: number) => void,
  readCachedPage: (pageIndex: number) => TItem[] | undefined,
  watchCachedPage: (pageIndex: number, onChange: () => void) => () => void,
}

type VariablesWithPagination = {
  pagination: { pageIndex: number, pageSize: number },
  sorts?: QuerySortClauseInput[],
  filters?: QueryFilterClauseInput[],
  search?: QuerySearchInput,
}

export function usePaginatedEntityQuery<
  TQueryData,
  TVariables extends Record<string, unknown>,
  TItem
>(
  document: Parameters<typeof useQueryWhenReady<TQueryData, TVariables & VariablesWithPagination>>[0],
  variables: TVariables | undefined,
  options: UsePaginatedEntityQueryOptions<TQueryData>,
  extractItems: (data: TQueryData | undefined) => TItem[],
  extractTotal: (data: TQueryData | undefined) => number | undefined
): UsePaginatedEntityQueryResult<TItem> {
  const { pagination, sorts, filters, search, skip: skipQuery } = options
  const baseVariables = useMemo(() => ({
    ...(variables ?? {}),
    ...(sorts != null && sorts.length > 0 ? { sorts } : {}),
    ...(filters != null && filters.length > 0 ? { filters } : {}),
    ...(search != null && search.searchText ? { search } : {}),
  }), [variables, sorts, filters, search])
  const variablesWithPagination = useMemo(() => ({
    ...baseVariables,
    pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize },
  }), [baseVariables, pagination.pageIndex, pagination.pageSize])
  const variablesTyped = variablesWithPagination as TVariables & VariablesWithPagination
  const result = useQueryWhenReady<TQueryData, TVariables & VariablesWithPagination>(
    document,
    variablesTyped,
    { fetchPolicy: 'cache-and-network', skip: skipQuery === true }
  )
  const extractItemsRef = useRef(extractItems)
  extractItemsRef.current = extractItems
  const extractTotalRef = useRef(extractTotal)
  extractTotalRef.current = extractTotal
  const totalCount = extractTotalRef.current(result.data)
  const data = useMemo(
    () => extractItemsRef.current(result.data),
    [result.data]
  )
  const refetch = useCallback(() => {
    result.refetch()
  }, [result])

  const client = useApolloClientOptional()
  const pageSize = pagination.pageSize
  const prefetchPage = useCallback((pageIndex: number) => {
    if (!client || skipQuery === true || pageIndex < 0) return
    void client.query({
      query: getParsedDocument(document),
      variables: { ...baseVariables, pagination: { pageIndex, pageSize } },
      fetchPolicy: 'cache-first',
    }).catch(() => {})
  }, [client, skipQuery, document, baseVariables, pageSize])

  const readCachedPage = useCallback((pageIndex: number): TItem[] | undefined => {
    if (!client || skipQuery === true || pageIndex < 0) return undefined
    try {
      const cached = client.cache.readQuery<TQueryData>({
        query: getParsedDocument(document),
        variables: { ...baseVariables, pagination: { pageIndex, pageSize } },
        optimistic: true,
      })
      if (cached == null) return undefined
      return extractItemsRef.current(cached)
    } catch {
      return undefined
    }
  }, [client, skipQuery, document, baseVariables, pageSize])

  const watchCachedPage = useCallback((pageIndex: number, onChange: () => void): (() => void) => {
    if (!client || skipQuery === true || pageIndex < 0) return () => {}
    return client.cache.watch({
      query: getParsedDocument(document),
      variables: { ...baseVariables, pagination: { pageIndex, pageSize } },
      optimistic: true,
      callback: () => { onChange() },
    })
  }, [client, skipQuery, document, baseVariables, pageSize])

  return {
    data,
    loading: result.loading,
    error: result.error,
    totalCount,
    refetch,
    prefetchPage,
    readCachedPage,
    watchCachedPage,
  }
}
