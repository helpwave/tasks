import {
  GetPropertyDefinitionsDocument,
  type GetPropertyDefinitionsQuery,
  type GetPropertyDefinitionsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

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
  const result = useQueryWhenReady<
    GetPropertyDefinitionsQuery,
    GetPropertyDefinitionsQueryVariables
  >(GetPropertyDefinitionsDocument, variables ?? {}, options)
  return result
}
