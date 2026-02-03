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
  options?: { skip?: boolean, fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' }
): UseGlobalDataResult {
  const result = useQueryWhenReady<
    GetGlobalDataQuery,
    GetGlobalDataQueryVariables
  >(GetGlobalDataDocument, variables ?? {}, { ...options, fetchPolicy: options?.fetchPolicy ?? 'cache-and-network' })
  return result
}
