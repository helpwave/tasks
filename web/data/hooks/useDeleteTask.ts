import { useMutation } from '@apollo/client/react'
import {
  DeleteTaskDocument,
  type DeleteTaskMutation,
  type DeleteTaskMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useDeleteTask() {
  const [mutate, result] = useMutation<
    DeleteTaskMutation,
    DeleteTaskMutationVariables
  >(getParsedDocument(DeleteTaskDocument))
  return [mutate, result] as const
}
