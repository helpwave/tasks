import { useMutation } from '@apollo/client/react'
import {
  CreateTaskPresetDocument,
  type CreateTaskPresetMutation,
  type CreateTaskPresetMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useCreateTaskPreset() {
  return useMutation<
    CreateTaskPresetMutation,
    CreateTaskPresetMutationVariables
  >(getParsedDocument(CreateTaskPresetDocument))
}
