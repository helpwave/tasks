import { useMutation } from '@apollo/client/react'
import {
  AssignTaskDocument,
  type AssignTaskMutation,
  type AssignTaskMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useAssignTask() {
  const [mutate, result] = useMutation<
    AssignTaskMutation,
    AssignTaskMutationVariables
  >(getParsedDocument(AssignTaskDocument))
  return [mutate, result] as const
}
