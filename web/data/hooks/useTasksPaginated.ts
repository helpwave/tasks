import {
  GetTasksDocument,
  type GetTasksQuery,
  type GetTasksQueryVariables
} from '@/api/gql/generated'
import type { QueryFilterClauseInput, QuerySortClauseInput, QuerySearchInput } from '@/api/gql/generated'
import { usePaginatedEntityQuery } from './usePaginatedEntityQuery'

export type UseTasksPaginatedOptions = {
  pagination: { pageIndex: number, pageSize: number },
  sorts?: QuerySortClauseInput[],
  filters?: QueryFilterClauseInput[],
  search?: QuerySearchInput,
}

export type UseTasksPaginatedResult = {
  data: GetTasksQuery['tasks'],
  loading: boolean,
  error: Error | undefined,
  totalCount: number | undefined,
  refetch: () => void,
}

export function useTasksPaginated(
  variables: GetTasksQueryVariables | undefined,
  options: UseTasksPaginatedOptions
): UseTasksPaginatedResult {
  return usePaginatedEntityQuery<
    GetTasksQuery,
    GetTasksQueryVariables,
    GetTasksQuery['tasks'][0]
  >(
    GetTasksDocument,
    variables,
    {
      pagination: options.pagination,
      sorts: options.sorts,
      filters: options.filters,
      search: options.search,
    },
    (data) => data?.tasks ?? [],
    (data) => data?.tasksTotal
  )
}
