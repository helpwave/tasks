import React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { fetcher } from '@/api/gql/fetcher'

export type PaginationMode = 'infinite' | 'numbered'

export interface PaginatedQueryOptions<TData, TVariables> {
  queryKey: QueryKey,
  queryFn: (page: number, variables: TVariables) => Promise<TData>,
  variables: TVariables,
  pageSize: number,
  mode?: PaginationMode,
  enabled?: boolean,
  refetchInterval?: number | false,
  refetchOnWindowFocus?: boolean,
  refetchOnMount?: boolean,
}

export interface PaginatedGraphQLQueryOptions<TQueryResult, TItem, TVariables extends Record<string, unknown>> {
  queryKey: QueryKey,
  document: string,
  baseVariables: TVariables,
  pageSize: number,
  extractItems: (queryResult: TQueryResult) => TItem[],
  mode?: PaginationMode,
  enabled?: boolean,
  refetchInterval?: number | false,
  refetchOnWindowFocus?: boolean,
  refetchOnMount?: boolean,
}

export interface PaginatedQueryResult<TData> {
  data: TData[],
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  fetchNextPage: () => void,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  refetch: () => void,
  totalPages?: number,
  currentPage?: number,
  goToPage?: (page: number) => void,
}

function useInfinitePaginatedQuery<TData, TVariables extends Record<string, unknown>>({
  queryKey,
  queryFn,
  variables,
  pageSize,
  enabled,
  refetchInterval,
  refetchOnWindowFocus,
  refetchOnMount,
}: Omit<PaginatedQueryOptions<TData, TVariables>, 'mode'>): PaginatedQueryResult<TData> {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...queryKey, variables],
    queryFn: ({ pageParam }) => queryFn(pageParam as number, variables),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastPageData = Array.isArray(lastPage) ? lastPage : []
      if (lastPageData.length < pageSize) {
        return undefined
      }
      return allPages.length
    },
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  })

  const flattenedData = data?.pages?.flatMap((page) => {
    return Array.isArray(page) ? page : []
  }) ?? []

  return {
    data: flattenedData as TData[],
    isLoading,
    isError,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch: () => {
      refetch()
    },
  }
}

function useNumberedPaginatedQuery<TData, TVariables extends Record<string, unknown>>({
  queryKey,
  queryFn,
  variables,
  pageSize,
  enabled,
  refetchInterval,
  refetchOnWindowFocus,
  refetchOnMount,
}: Omit<PaginatedQueryOptions<TData, TVariables>, 'mode'>): PaginatedQueryResult<TData> {
  const [currentPage, setCurrentPage] = React.useState(0)
  const [allPages, setAllPages] = React.useState<TData[][]>([])
  const prevVariablesRef = React.useRef<string>('')

  const variablesKey = JSON.stringify(variables)

  React.useEffect(() => {
    if (prevVariablesRef.current !== variablesKey) {
      setCurrentPage(0)
      setAllPages([])
      prevVariablesRef.current = variablesKey
    }
  }, [variablesKey])

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKey, variables, currentPage],
    queryFn: () => queryFn(currentPage, variables),
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  })

  React.useEffect(() => {
    if (data !== undefined) {
      const pageData = Array.isArray(data) ? data : []
      setAllPages((prev) => {
        const newPages = [...prev]
        newPages[currentPage] = pageData
        return newPages
      })
    }
  }, [data, currentPage])

  const flattenedData = allPages.flat()
  const lastPageData = allPages[currentPage] ?? []
  const hasNextPage = lastPageData.length >= pageSize

  const fetchNextPage = React.useCallback(() => {
    if (hasNextPage && !isLoading) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasNextPage, isLoading])

  const goToPage = React.useCallback((page: number) => {
    if (page >= 0 && page !== currentPage) {
      setCurrentPage(page)
    }
  }, [currentPage])

  return {
    data: flattenedData,
    isLoading,
    isError,
    error: error as Error | null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: false,
    refetch: () => {
      setCurrentPage(0)
      setAllPages([])
      refetch()
    },
    currentPage,
    goToPage,
  }
}

export function usePaginatedQuery<TData, TVariables extends Record<string, unknown>>({
  queryKey,
  queryFn,
  variables,
  pageSize,
  mode = 'infinite',
  enabled = true,
  refetchInterval,
  refetchOnWindowFocus = true,
  refetchOnMount = true,
}: PaginatedQueryOptions<TData, TVariables>): PaginatedQueryResult<TData> {
  const infiniteResult = useInfinitePaginatedQuery({
    queryKey,
    queryFn,
    variables,
    pageSize,
    enabled: mode === 'infinite' && enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  })

  const numberedResult = useNumberedPaginatedQuery({
    queryKey,
    queryFn,
    variables,
    pageSize,
    enabled: mode === 'numbered' && enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  })

  return mode === 'infinite' ? infiniteResult : numberedResult
}

export function usePaginatedGraphQLQuery<TQueryResult, TItem, TVariables extends Record<string, unknown>>({
  queryKey,
  document,
  baseVariables,
  pageSize,
  extractItems,
  mode = 'infinite',
  enabled = true,
  refetchInterval,
  refetchOnWindowFocus = true,
  refetchOnMount = true,
}: PaginatedGraphQLQueryOptions<TQueryResult, TItem, TVariables>): PaginatedQueryResult<TItem> {
  const queryFn = React.useCallback(
    async (page: number, variables: TVariables): Promise<TItem[]> => {
      const paginatedVariables = {
        ...variables,
        limit: pageSize,
        offset: page * pageSize,
      }
      const result = await fetcher<TQueryResult, typeof paginatedVariables>(document, paginatedVariables)()
      return extractItems(result)
    },
    [document, pageSize, extractItems]
  )

  const result = usePaginatedQuery<TItem[], TVariables>({
    queryKey,
    queryFn,
    variables: baseVariables,
    pageSize,
    mode,
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
  })

  return {
    ...result,
    data: result.data as TItem[],
  }
}

