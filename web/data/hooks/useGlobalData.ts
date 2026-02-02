import {
  GetGlobalDataDocument,
  type GetGlobalDataQuery,
  type GetGlobalDataQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseGlobalDataResult = {
  data: GetGlobalDataQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useGlobalData(
  variables?: GetGlobalDataQueryVariables,
  options?: { skip?: boolean }
): UseGlobalDataResult {
  const result = useQueryWhenReady<
    GetGlobalDataQuery,
    GetGlobalDataQueryVariables
  >(GetGlobalDataDocument, variables ?? {}, options)
  return result
}
