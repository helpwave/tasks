import {
  GetTasksDocument,
  type GetTasksQuery,
  type GetTasksQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseTasksResult = {
  data: GetTasksQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useTasks(
  variables?: GetTasksQueryVariables,
  options?: { skip?: boolean }
): UseTasksResult {
  const result = useQueryWhenReady<GetTasksQuery, GetTasksQueryVariables>(
    GetTasksDocument,
    variables ?? {},
    options
  )
  return result
}
