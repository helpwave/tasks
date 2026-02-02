import { useMutation } from '@apollo/client/react'
import {
  CreatePatientDocument,
  type CreatePatientMutation,
  type CreatePatientMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useCreatePatient() {
  const [mutate, result] = useMutation<
    CreatePatientMutation,
    CreatePatientMutationVariables
  >(getParsedDocument(CreatePatientDocument))
  return [mutate, result] as const
}
