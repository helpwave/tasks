import {
  GetMyTasksDocument,
  type GetMyTasksQuery,
  type GetMyTasksQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseMyTasksResult = {
  data: GetMyTasksQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useMyTasks(
  variables?: GetMyTasksQueryVariables,
  options?: { skip?: boolean }
): UseMyTasksResult {
  const result = useQueryWhenReady<GetMyTasksQuery, GetMyTasksQueryVariables>(
    GetMyTasksDocument,
    variables ?? {},
    options
  )
  return result
}
