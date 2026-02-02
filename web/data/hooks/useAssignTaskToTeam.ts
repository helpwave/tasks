import { useMutation } from '@apollo/client/react'
import {
  AssignTaskToTeamDocument,
  type AssignTaskToTeamMutation,
  type AssignTaskToTeamMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useAssignTaskToTeam() {
  const [mutate, result] = useMutation<
    AssignTaskToTeamMutation,
    AssignTaskToTeamMutationVariables
  >(getParsedDocument(AssignTaskToTeamDocument))
  return [mutate, result] as const
}
