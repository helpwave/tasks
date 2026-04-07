import {
  GetLocationNodeDocument,
  type GetLocationNodeQuery,
  type GetLocationNodeQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseLocationNodeResult = {
  data: GetLocationNodeQuery['locationNode'] | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useLocationNode(
  id: string,
  options?: { skip?: boolean }
): UseLocationNodeResult {
  const result = useQueryWhenReady<
    GetLocationNodeQuery,
    GetLocationNodeQueryVariables
  >(GetLocationNodeDocument, { id }, options)
  return {
    ...result,
    data: result.data?.locationNode,
  }
}
