import { useMutation } from '@apollo/client/react'
import {
  RemoveTaskAssigneeDocument,
  type RemoveTaskAssigneeMutation,
  type RemoveTaskAssigneeMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUnassignTask() {
  const [mutate, result] = useMutation<
    RemoveTaskAssigneeMutation,
    RemoveTaskAssigneeMutationVariables
  >(getParsedDocument(RemoveTaskAssigneeDocument))
  return [mutate, result] as const
}
