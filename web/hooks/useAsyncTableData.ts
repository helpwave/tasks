import { useMemo } from 'react'
import { useQuery, type DocumentNode } from '@apollo/client/react'
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import {
  mapColumnFiltersToGraphQL,
  mapPaginationToGraphQL,
  mapSearchToGraphQL,
  mapSortingToGraphQL,
} from '@/utils/tableFilters'

type EntityType = 'patient' | 'task'

export interface UseAsyncTableDataOptions<TQueryResult, TItem, TVariables extends Record<string, unknown>> {
  queryKey: unknown[]
  document: DocumentNode
  baseVariables: TVariables
  pageIndex: number
  pageSize: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  searchText: string
  searchColumns?: string[]
  columns: ColumnDef<any>[]
  entityType: EntityType
  extractItems: (queryResult: TQueryResult) => TItem[]
  extractTotalCount: (queryResult: TQueryResult) => number
  enabled?: boolean
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
}

export interface UseAsyncTableDataResult<TItem> {
  data: TItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  totalCount: number
  pageCount: number
  refetch: () => void
}

export function useAsyncTableData<TQueryResult, TItem, TVariables extends Record<string, unknown>>({
  queryKey,
  document,
  baseVariables,
  pageIndex,
  pageSize,
  sorting,
  columnFilters,
  searchText,
  searchColumns,
  columns,
  entityType,
  extractItems,
  extractTotalCount,
  enabled = true,
  refetchInterval,
  refetchOnWindowFocus = true,
  refetchOnMount = true,
}: UseAsyncTableDataOptions<TQueryResult, TItem, TVariables>): UseAsyncTableDataResult<TItem> {
  const graphQLVariables = useMemo(() => {
    const filtering = mapColumnFiltersToGraphQL(columnFilters, columns, entityType)
    const sortingInput = mapSortingToGraphQL(sorting, entityType)
    const pagination = mapPaginationToGraphQL({ pageIndex, pageSize } as PaginationState)
    const search = mapSearchToGraphQL(searchText, searchColumns)

    return {
      ...baseVariables,
      filtering: filtering.length > 0 ? filtering : undefined,
      sorting: sortingInput.length > 0 ? sortingInput : undefined,
      pagination: pagination.pageSize ? pagination : undefined,
      search: search || undefined,
    }
  }, [baseVariables, columnFilters, sorting, pageIndex, pageSize, searchText, searchColumns, columns, entityType])

  const {
    data: queryResult,
    loading: isLoading,
    error,
    refetch,
  } = useQuery<TQueryResult, typeof graphQLVariables>(document, {
    variables: graphQLVariables as TVariables,
    skip: !enabled,
    pollInterval: refetchInterval || undefined,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: refetchOnMount ? 'cache-and-network' : 'cache-first',
  })

  const isError = !!error

  const data = useMemo(() => {
    if (!queryResult) return []
    return extractItems(queryResult)
  }, [queryResult, extractItems])

  const totalCount = useMemo(() => {
    if (!queryResult) return 0
    return extractTotalCount(queryResult)
  }, [queryResult, extractTotalCount])

  const pageCount = useMemo(() => {
    if (pageSize <= 0) return 0
    return Math.ceil(totalCount / pageSize)
  }, [totalCount, pageSize])

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    totalCount,
    pageCount,
    refetch: () => {
      refetch()
    },
  }
}
