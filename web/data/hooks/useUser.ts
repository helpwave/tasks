import {
  GetUserDocument,
  type GetUserQuery,
  type GetUserQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseUserResult = {
  data: GetUserQuery['user'] | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useUser(
  id: string,
  options?: { skip?: boolean }
): UseUserResult {
  const result = useQueryWhenReady<GetUserQuery, GetUserQueryVariables>(
    GetUserDocument,
    { id },
    options
  )
  return {
    ...result,
    data: result.data?.user,
  }
}
