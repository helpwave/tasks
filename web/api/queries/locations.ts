import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_LOCATIONS = gql`
  query GetLocations($limit: Int, $offset: Int) {
    locationNodes(limit: $limit, offset: $offset) {
      id
      title
      kind
      parentId
    }
  }
`

export const GET_LOCATION_NODE = gql`
  query GetLocationNode($id: ID!) {
    locationNode(id: $id) {
      id
      title
      kind
      parentId
      parent {
        id
        title
        kind
        parentId
        parent {
          id
          title
          kind
          parentId
          parent {
            id
            title
            kind
            parentId
            parent {
              id
              title
              kind
              parentId
            }
          }
        }
      }
    }
  }
`

export interface GetLocationsVariables {
  limit?: number | null
  offset?: number | null
}

export interface GetLocationsData {
  locationNodes: Array<{
    __typename?: 'LocationNodeType'
    id: string
    title: string
    kind: string
    parentId?: string | null
  }>
}

export interface GetLocationNodeVariables {
  id: string
}

export interface GetLocationNodeData {
  locationNode?: {
    __typename?: 'LocationNodeType'
    id: string
    title: string
    kind: string
    parentId?: string | null
    parent?: {
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
      parentId?: string | null
      parent?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parentId?: string | null
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          kind: string
          parentId?: string | null
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            kind: string
            parentId?: string | null
          } | null
        } | null
      } | null
    } | null
  } | null
}

export const useGetLocationsQuery = createQueryHook<GetLocationsData, GetLocationsVariables>(GET_LOCATIONS)
export const useGetLocationNodeQuery = createQueryHook<GetLocationNodeData, GetLocationNodeVariables>(GET_LOCATION_NODE)
