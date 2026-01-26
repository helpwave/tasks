import { gql, useMutation } from '@apollo/client/react'
import { GET_LOCATIONS, GET_LOCATION_NODE } from '../queries/locations'
import { GET_GLOBAL_DATA } from '../queries/global'

export const CREATE_LOCATION_NODE = gql`
  mutation CreateLocationNode($data: CreateLocationNodeInput!) {
    createLocationNode(data: $data) {
      id
      title
      kind
      parentId
    }
  }
`

export const UPDATE_LOCATION_NODE = gql`
  mutation UpdateLocationNode($id: ID!, $data: UpdateLocationNodeInput!) {
    updateLocationNode(id: $id, data: $data) {
      id
      title
      kind
      parentId
    }
  }
`

export const DELETE_LOCATION_NODE = gql`
  mutation DeleteLocationNode($id: ID!) {
    deleteLocationNode(id: $id)
  }
`

export interface CreateLocationNodeVariables {
  data: {
    title: string
    kind: string
    parentId?: string | null
  }
}

export interface UpdateLocationNodeVariables {
  id: string
  data: {
    title?: string | null
    kind?: string | null
    parentId?: string | null
  }
}

export interface DeleteLocationNodeVariables {
  id: string
}

export function useCreateLocationNodeMutation() {
  return useMutation(CREATE_LOCATION_NODE, {
    refetchQueries: [{ query: GET_LOCATIONS }, { query: GET_GLOBAL_DATA }],
  })
}

export function useUpdateLocationNodeMutation() {
  return useMutation(UPDATE_LOCATION_NODE, {
    refetchQueries: [{ query: GET_LOCATIONS }, { query: GET_LOCATION_NODE }, { query: GET_GLOBAL_DATA }],
    update: (cache, { data }) => {
      if (!data?.updateLocationNode) return

      cache.modify({
        id: cache.identify({ __typename: 'LocationNodeType', id: data.updateLocationNode.id }),
        fields: {
          title: () => data.updateLocationNode.title,
          kind: () => data.updateLocationNode.kind,
          parentId: () => data.updateLocationNode.parentId,
        },
      })
    },
  })
}

export function useDeleteLocationNodeMutation() {
  return useMutation(DELETE_LOCATION_NODE, {
    refetchQueries: [{ query: GET_LOCATIONS }, { query: GET_GLOBAL_DATA }],
    update: (cache, _, { variables }) => {
      if (!variables?.id) return
      cache.evict({ id: cache.identify({ __typename: 'LocationNodeType', id: variables.id }) })
      cache.gc()
    },
  })
}
