import { useMutation } from '@apollo/client/react'
import {
  UpdateProfilePictureDocument,
  type UpdateProfilePictureMutation,
  type UpdateProfilePictureMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'

export function useUpdateProfilePicture() {
  const [mutate, result] = useMutation<
    UpdateProfilePictureMutation,
    UpdateProfilePictureMutationVariables
  >(getParsedDocument(UpdateProfilePictureDocument))
  return [mutate, result] as const
}
