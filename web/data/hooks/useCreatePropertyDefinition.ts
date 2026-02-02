import { useMutation } from '@apollo/client/react'
import {
  CreatePropertyDefinitionDocument,
  type CreatePropertyDefinitionMutation,
  type CreatePropertyDefinitionMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useCreatePropertyDefinition() {
  const [mutate, result] = useMutation<
    CreatePropertyDefinitionMutation,
    CreatePropertyDefinitionMutationVariables
  >(getParsedDocument(CreatePropertyDefinitionDocument))
  return [mutate, result] as const
}
