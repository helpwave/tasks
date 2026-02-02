import {
  GetUsersDocument,
  type GetUsersQuery,
  type GetUsersQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseUsersResult = {
  data: GetUsersQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useUsers(
  variables?: GetUsersQueryVariables,
  options?: { skip?: boolean }
): UseUsersResult {
  const result = useQueryWhenReady<GetUsersQuery, GetUsersQueryVariables>(
    GetUsersDocument,
    variables ?? {},
    options
  )
  return result
}
