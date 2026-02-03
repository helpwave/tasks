import {
  GetOverviewDataDocument,
  type GetOverviewDataQuery,
  type GetOverviewDataQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseOverviewDataResult = {
  data: GetOverviewDataQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useOverviewData(
  variables?: GetOverviewDataQueryVariables,
  options?: { skip?: boolean, fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' }
): UseOverviewDataResult {
  const result = useQueryWhenReady<
    GetOverviewDataQuery,
    GetOverviewDataQueryVariables
  >(GetOverviewDataDocument, variables ?? {}, { ...options, fetchPolicy: options?.fetchPolicy ?? 'cache-and-network' })
  return result
}
