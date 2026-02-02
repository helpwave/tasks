import {
  GetPatientsDocument,
  type GetPatientsQuery,
  type GetPatientsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UsePatientsResult = {
  data: GetPatientsQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function usePatients(
  variables?: GetPatientsQueryVariables,
  options?: { skip?: boolean }
): UsePatientsResult {
  const result = useQueryWhenReady<GetPatientsQuery, GetPatientsQueryVariables>(
    GetPatientsDocument,
    variables ?? {},
    options
  )
  return result
}
