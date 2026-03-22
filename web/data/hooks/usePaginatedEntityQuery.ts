import { useCallback, useMemo } from 'react'
import { useQueryWhenReady } from './queryHelpers'
import type { QueryFilterClauseInput, QuerySearchInput, QuerySortClauseInput } from '@/api/gql/generated'

export type UsePaginatedEntityQueryOptions<TQueryData> = {
  pagination: { pageIndex: number, pageSize: number },
  sorts?: QuerySortClauseInput[],
  filters?: QueryFilterClauseInput[],
  search?: QuerySearchInput,
  getPageDataKey?: (data: TQueryData | undefined) => string,
}

export type UsePaginatedEntityQueryResult<TItem> = {
  data: TItem[],
  loading: boolean,
  error: Error | undefined,
  totalCount: number | undefined,
  refetch: () => void,
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
  const { pagination, sorts, filters, search } = options
  const variablesWithPagination = useMemo(() => ({
    ...(variables ?? {}),
    pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize },
    ...(sorts != null && sorts.length > 0 ? { sorts } : {}),
    ...(filters != null && filters.length > 0 ? { filters } : {}),
    ...(search != null && search.searchText ? { search } : {}),
  }), [variables, pagination.pageIndex, pagination.pageSize, sorts, filters, search])
  const variablesTyped = variablesWithPagination as TVariables & VariablesWithPagination
  const result = useQueryWhenReady<TQueryData, TVariables & VariablesWithPagination>(
    document,
    variablesTyped,
    { fetchPolicy: 'cache-and-network' }
  )
  const totalCount = extractTotal(result.data)
  const data = useMemo(
    () => extractItems(result.data),
    [result.data, extractItems]
  )
  const refetch = useCallback(() => {
    result.refetch()
  }, [result])

  return {
    data,
    loading: result.loading,
    error: result.error,
    totalCount,
    refetch,
  }
}
