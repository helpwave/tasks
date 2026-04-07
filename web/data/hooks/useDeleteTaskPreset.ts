import { useMutation } from '@apollo/client/react'
import {
  DeleteTaskPresetDocument,
  type DeleteTaskPresetMutation,
  type DeleteTaskPresetMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useDeleteTaskPreset() {
  return useMutation<
    DeleteTaskPresetMutation,
    DeleteTaskPresetMutationVariables
  >(getParsedDocument(DeleteTaskPresetDocument))
}
