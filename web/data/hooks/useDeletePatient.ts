import { useMutation } from '@apollo/client/react'
import {
  DeletePatientDocument,
  type DeletePatientMutation,
  type DeletePatientMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useDeletePatient() {
  const [mutate, result] = useMutation<
    DeletePatientMutation,
    DeletePatientMutationVariables
  >(getParsedDocument(DeletePatientDocument))
  return [mutate, result] as const
}
