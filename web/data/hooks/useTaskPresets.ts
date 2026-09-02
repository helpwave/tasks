import { useQuery } from '@apollo/client/react'
import {
  TaskPresetsDocument,
  type TaskPresetsQuery,
  type TaskPresetsQueryVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'
import { useScopeRootLocationIds } from './useScopeRootLocationIds'

export function useTaskPresets() {
  const rootLocationIds = useScopeRootLocationIds()
  return useQuery<TaskPresetsQuery, TaskPresetsQueryVariables>(
    getParsedDocument(TaskPresetsDocument),
    {
      variables: { rootLocationIds },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  )
}
