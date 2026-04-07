import { useMutation } from '@apollo/client/react'
import {
  CreateTaskPresetDocument,
  type CreateTaskPresetMutation,
  type CreateTaskPresetMutationVariables
} from '@/api/gql/generated'
import { refetchTaskPresetsMutationOptions } from '../cache/taskPresetMutationDefaults'
import { getParsedDocument } from './queryHelpers'

export function useCreateTaskPreset() {
  return useMutation<
    CreateTaskPresetMutation,
    CreateTaskPresetMutationVariables
  >(getParsedDocument(CreateTaskPresetDocument), {
    ...refetchTaskPresetsMutationOptions,
  })
}
