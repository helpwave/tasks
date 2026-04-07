import { useQueryWhenReady } from './queryHelpers'
import {
  QueryableFieldsDocument,
  type QueryableFieldsQuery,
  type QueryableFieldsQueryVariables
} from '@/api/gql/generated'

export function useQueryableFields(entity: string) {
  return useQueryWhenReady<QueryableFieldsQuery, QueryableFieldsQueryVariables>(
    QueryableFieldsDocument,
    { entity },
    { fetchPolicy: 'cache-first' }
  )
}
