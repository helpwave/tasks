import { useQuery } from '@apollo/client/react'
import {
  TaskPresetsDocument,
  type TaskPresetsQuery,
  type TaskPresetsQueryVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useTaskPresets() {
  return useQuery<TaskPresetsQuery, TaskPresetsQueryVariables>(
    getParsedDocument(TaskPresetsDocument),
    {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  )
}
