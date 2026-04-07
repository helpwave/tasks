import { useMutation } from '@apollo/client/react'
import {
  UnassignTaskFromTeamDocument,
  type UnassignTaskFromTeamMutation,
  type UnassignTaskFromTeamMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUnassignTaskFromTeam() {
  const [mutate, result] = useMutation<
    UnassignTaskFromTeamMutation,
    UnassignTaskFromTeamMutationVariables
  >(getParsedDocument(UnassignTaskFromTeamDocument))
  return [mutate, result] as const
}
