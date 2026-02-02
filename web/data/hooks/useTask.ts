import {
  GetTaskDocument,
  type GetTaskQuery,
  type GetTaskQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseTaskResult = {
  data: GetTaskQuery['task'] | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useTask(
  id: string,
  options?: { skip?: boolean }
): UseTaskResult {
  const result = useQueryWhenReady<GetTaskQuery, GetTaskQueryVariables>(
    GetTaskDocument,
    { id },
    options
  )
  return {
    ...result,
    data: result.data?.task,
  }
}
