import {
  GetPropertyDefinitionsDocument,
  type GetPropertyDefinitionsQuery,
  type GetPropertyDefinitionsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'
import { useScopeRootLocationIds } from './useScopeRootLocationIds'

export type UsePropertyDefinitionsResult = {
  data: GetPropertyDefinitionsQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function usePropertyDefinitions(
  variables?: GetPropertyDefinitionsQueryVariables,
  options?: { skip?: boolean }
): UsePropertyDefinitionsResult {
  const rootLocationIds = useScopeRootLocationIds()
  const result = useQueryWhenReady<
    GetPropertyDefinitionsQuery,
    GetPropertyDefinitionsQueryVariables
  >(GetPropertyDefinitionsDocument, { rootLocationIds, ...variables }, options)
  return result
}
