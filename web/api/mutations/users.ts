import { gql, useMutation } from '@apollo/client/react'
import { GET_USER } from '../queries/users'

export const UPDATE_PROFILE_PICTURE = gql`
  mutation UpdateProfilePicture($data: UpdateProfilePictureInput!) {
    updateProfilePicture(data: $data) {
      id
      username
      name
      email
      firstname
      lastname
      title
      avatarUrl
      lastOnline
      isOnline
    }
  }
`

export interface UpdateProfilePictureVariables {
  data: {
    file: File
  }
}

export function useUpdateProfilePictureMutation() {
  return useMutation(UPDATE_PROFILE_PICTURE, {
    refetchQueries: [{ query: GET_USER }],
  })
}
