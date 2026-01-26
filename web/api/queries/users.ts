import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      avatarUrl
      lastOnline
      isOnline
    }
  }
`

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
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

export interface GetUsersVariables {
}

export interface GetUsersData {
  users: Array<{
    __typename?: 'UserType'
    id: string
    name: string
    avatarUrl?: string | null
    lastOnline?: string | null
    isOnline: boolean
  }>
}

export interface GetUserVariables {
  id: string
}

export interface GetUserData {
  user?: {
    __typename?: 'UserType'
    id: string
    username: string
    name: string
    email: string
    firstname: string
    lastname: string
    title?: string | null
    avatarUrl?: string | null
    lastOnline?: string | null
    isOnline: boolean
  } | null
}

export const useGetUsersQuery = createQueryHook<GetUsersData, GetUsersVariables>(GET_USERS)
export const useGetUserQuery = createQueryHook<GetUserData, GetUserVariables>(GET_USER)
