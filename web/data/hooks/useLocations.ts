import {
  GetLocationsDocument,
  type GetLocationsQuery,
  type GetLocationsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseLocationsResult = {
  data: GetLocationsQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useLocations(
  variables?: GetLocationsQueryVariables,
  options?: { skip?: boolean }
): UseLocationsResult {
  const result = useQueryWhenReady<GetLocationsQuery, GetLocationsQueryVariables>(
    GetLocationsDocument,
    variables ?? {},
    options
  )
  return result
}
