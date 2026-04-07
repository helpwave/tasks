import {
  GetPatientDocument,
  type GetPatientQuery,
  type GetPatientQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UsePatientResult = {
  data: GetPatientQuery['patient'] | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function usePatient(
  id: string,
  options?: { skip?: boolean }
): UsePatientResult {
  const result = useQueryWhenReady<GetPatientQuery, GetPatientQueryVariables>(
    GetPatientDocument,
    { id },
    options
  )
  return {
    ...result,
    data: result.data?.patient,
  }
}
