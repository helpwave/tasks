import { useMutation } from '@apollo/client/react'
import {
  DeleteTaskPresetDocument,
  type DeleteTaskPresetMutation,
  type DeleteTaskPresetMutationVariables
} from '@/api/gql/generated'
import { refetchTaskPresetsMutationOptions } from '../cache/taskPresetMutationDefaults'
import { getParsedDocument } from './queryHelpers'

export function useDeleteTaskPreset() {
  return useMutation<
    DeleteTaskPresetMutation,
    DeleteTaskPresetMutationVariables
  >(getParsedDocument(DeleteTaskPresetDocument), {
    ...refetchTaskPresetsMutationOptions,
    update(cache, _result, { variables }) {
      const id = variables?.id
      if (typeof id !== 'string') return
      const normalizedId = cache.identify({ __typename: 'TaskPresetType', id })
      if (normalizedId) {
        cache.evict({ id: normalizedId })
      }
      cache.gc()
    },
  })
}
