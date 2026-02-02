import { useCallback, useEffect, useState } from 'react'
import {
  GetTasksDocument,
  type GetTasksQuery,
  type GetTasksQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseTasksPaginatedOptions = {
  pageSize: number,
}

export type UseTasksPaginatedResult = {
  data: GetTasksQuery['tasks'],
  loading: boolean,
  error: Error | undefined,
  fetchNextPage: () => void,
  hasNextPage: boolean,
  totalCount: number | undefined,
  refetch: () => void,
}

export function useTasksPaginated(
  variables: GetTasksQueryVariables | undefined,
  options: UseTasksPaginatedOptions
): UseTasksPaginatedResult {
  const { pageSize } = options
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<(GetTasksQuery | undefined)[]>([])
  const variablesWithPagination: GetTasksQueryVariables = {
    ...(variables ?? {}),
    pagination: { pageIndex, pageSize },
  }
  const result = useQueryWhenReady<GetTasksQuery, GetTasksQueryVariables>(
    GetTasksDocument,
    variablesWithPagination
  )
  const totalCount = result.data?.tasksTotal

  useEffect(() => {
    if (!result.loading && result.data !== undefined) {
      setPages((prev) => {
        const next = [...prev]
        next[pageIndex] = result.data
        return next
      })
    }
  }, [result.loading, result.data, pageIndex])

  const flattenedTasks = pages.flatMap((p) => p?.tasks ?? [])
  const hasNextPage =
    (totalCount !== undefined && flattenedTasks.length < totalCount) ?? false

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !result.loading) {
      setPageIndex((i) => i + 1)
    }
  }, [hasNextPage, result.loading])

  const refetch = useCallback(() => {
    result.refetch()
  }, [result.refetch])

  return {
    data: flattenedTasks,
    loading: result.loading,
    error: result.error,
    fetchNextPage,
    hasNextPage,
    totalCount,
    refetch,
  }
}
