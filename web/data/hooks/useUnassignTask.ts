import { useMutation } from '@apollo/client/react'
import {
  UnassignTaskDocument,
  type UnassignTaskMutation,
  type UnassignTaskMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUnassignTask() {
  const [mutate, result] = useMutation<
    UnassignTaskMutation,
    UnassignTaskMutationVariables
  >(getParsedDocument(UnassignTaskDocument))
  return [mutate, result] as const
}
