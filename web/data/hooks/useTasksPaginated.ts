import {
  GetTasksDocument,
  type GetTasksQuery,
  type GetTasksQueryVariables
} from '@/api/gql/generated'
import { usePaginatedEntityQuery } from './usePaginatedEntityQuery'

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
  return usePaginatedEntityQuery<
    GetTasksQuery,
    GetTasksQueryVariables,
    GetTasksQuery['tasks'][0]
  >(
    GetTasksDocument,
    variables,
    { pageSize: options.pageSize },
    (data) => data?.tasks ?? [],
    (data) => data?.tasksTotal
  )
}
