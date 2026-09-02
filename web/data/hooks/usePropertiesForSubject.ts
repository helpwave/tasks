import {
  GetPropertiesForSubjectDocument,
  type GetPropertiesForSubjectQuery,
  type GetPropertiesForSubjectQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'
import { useScopeRootLocationIds } from './useScopeRootLocationIds'

export type UsePropertiesForSubjectResult = {
  data: GetPropertiesForSubjectQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function usePropertiesForSubject(
  variables: GetPropertiesForSubjectQueryVariables,
  options?: { skip?: boolean }
): UsePropertiesForSubjectResult {
  const rootLocationIds = useScopeRootLocationIds()
  const result = useQueryWhenReady<
    GetPropertiesForSubjectQuery,
    GetPropertiesForSubjectQueryVariables
  >(GetPropertiesForSubjectDocument, { rootLocationIds, ...variables }, options)
  return result
}
