import { useMutation } from '@apollo/client/react'
import {
  ApplyTaskGraphDocument,
  type ApplyTaskGraphMutation,
  type ApplyTaskGraphMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useApplyTaskGraph() {
  return useMutation<
    ApplyTaskGraphMutation,
    ApplyTaskGraphMutationVariables
  >(getParsedDocument(ApplyTaskGraphDocument))
}
