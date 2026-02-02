import {
  GetPropertiesForSubjectDocument,
  type GetPropertiesForSubjectQuery,
  type GetPropertiesForSubjectQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

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
  const result = useQueryWhenReady<
    GetPropertiesForSubjectQuery,
    GetPropertiesForSubjectQueryVariables
  >(GetPropertiesForSubjectDocument, variables, options)
  return result
}
