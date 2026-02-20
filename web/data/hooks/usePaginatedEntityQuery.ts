import { useCallback, useMemo } from 'react'
import { useQueryWhenReady } from './queryHelpers'
import type { FilterInput, SortInput } from '@/api/gql/generated'

export type UsePaginatedEntityQueryOptions<TQueryData> = {
  pagination: { pageIndex: number, pageSize: number },
  sorting?: SortInput[],
  filtering?: FilterInput[],
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
  sorting?: SortInput[],
  filtering?: FilterInput[],
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
  const { pagination, sorting, filtering } = options
  const variablesWithPagination = useMemo(() => ({
    ...(variables ?? {}),
    pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize },
    ...(sorting != null && sorting.length > 0 ? { sorting } : {}),
    ...(filtering != null && filtering.length > 0 ? { filtering } : {}),
  }), [variables, pagination.pageIndex, pagination.pageSize, sorting, filtering])
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
