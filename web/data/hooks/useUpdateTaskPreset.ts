import { useMutation } from '@apollo/client/react'
import {
  UpdateTaskPresetDocument,
  type UpdateTaskPresetMutation,
  type UpdateTaskPresetMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUpdateTaskPreset() {
  return useMutation<
    UpdateTaskPresetMutation,
    UpdateTaskPresetMutationVariables
  >(getParsedDocument(UpdateTaskPresetDocument))
}
