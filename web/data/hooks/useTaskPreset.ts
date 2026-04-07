import { useQuery } from '@apollo/client/react'
import {
  TaskPresetDocument,
  type TaskPresetQuery,
  type TaskPresetQueryVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useTaskPreset(id: string | null | undefined) {
  return useQuery<TaskPresetQuery, TaskPresetQueryVariables>(
    getParsedDocument(TaskPresetDocument),
    {
      variables: { id: id ?? '' },
      skip: !id,
    }
  )
}
