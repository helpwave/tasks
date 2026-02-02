import { useMutation } from '@apollo/client/react'
import {
  CreateTaskDocument,
  type CreateTaskMutation,
  type CreateTaskMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useCreateTask() {
  const [mutate, result] = useMutation<
    CreateTaskMutation,
    CreateTaskMutationVariables
  >(getParsedDocument(CreateTaskDocument))
  return [mutate, result] as const
}
