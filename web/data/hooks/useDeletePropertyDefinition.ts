import { useMutation } from '@apollo/client/react'
import {
  DeletePropertyDefinitionDocument,
  type DeletePropertyDefinitionMutation,
  type DeletePropertyDefinitionMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useDeletePropertyDefinition() {
  const [mutate, result] = useMutation<
    DeletePropertyDefinitionMutation,
    DeletePropertyDefinitionMutationVariables
  >(getParsedDocument(DeletePropertyDefinitionDocument))
  return [mutate, result] as const
}
