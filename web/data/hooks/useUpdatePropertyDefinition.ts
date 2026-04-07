import { useMutation } from '@apollo/client/react'
import {
  UpdatePropertyDefinitionDocument,
  type UpdatePropertyDefinitionMutation,
  type UpdatePropertyDefinitionMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUpdatePropertyDefinition() {
  const [mutate, result] = useMutation<
    UpdatePropertyDefinitionMutation,
    UpdatePropertyDefinitionMutationVariables
  >(getParsedDocument(UpdatePropertyDefinitionDocument))
  return [mutate, result] as const
}
