import {
  GetTasksDocument,
  type GetTasksQuery,
  type GetTasksQueryVariables
} from '@/api/gql/generated'
import type { FilterInput, SortInput } from '@/api/gql/generated'
import { usePaginatedEntityQuery } from './usePaginatedEntityQuery'

export type UseTasksPaginatedOptions = {
  pagination: { pageIndex: number, pageSize: number },
  sorting?: SortInput[],
  filtering?: FilterInput[],
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
      sorting: options.sorting,
      filtering: options.filtering,
    },
    (data) => data?.tasks ?? [],
    (data) => data?.tasksTotal
  )
}
