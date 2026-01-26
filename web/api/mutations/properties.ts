import { gql, useMutation } from '@apollo/client/react'
import { GET_PROPERTY_DEFINITIONS } from '../queries/properties'

export const CREATE_PROPERTY_DEFINITION = gql`
  mutation CreatePropertyDefinition($data: CreatePropertyDefinitionInput!) {
    createPropertyDefinition(data: $data) {
      id
      name
      description
      fieldType
      isActive
      allowedEntities
      options
    }
  }
`

export const UPDATE_PROPERTY_DEFINITION = gql`
  mutation UpdatePropertyDefinition($id: ID!, $data: UpdatePropertyDefinitionInput!) {
    updatePropertyDefinition(id: $id, data: $data) {
      id
      name
      description
      fieldType
      isActive
      allowedEntities
      options
    }
  }
`

export const DELETE_PROPERTY_DEFINITION = gql`
  mutation DeletePropertyDefinition($id: ID!) {
    deletePropertyDefinition(id: $id)
  }
`

export interface CreatePropertyDefinitionVariables {
  data: {
    name: string
    description?: string | null
    fieldType: string
    isActive?: boolean
    allowedEntities: Array<string>
    options?: Array<string> | null
  }
}

export interface UpdatePropertyDefinitionVariables {
  id: string
  data: {
    name?: string | null
    description?: string | null
    fieldType?: string | null
    isActive?: boolean | null
    allowedEntities?: Array<string> | null
    options?: Array<string> | null
  }
}

export interface DeletePropertyDefinitionVariables {
  id: string
}

export function useCreatePropertyDefinitionMutation() {
  return useMutation(CREATE_PROPERTY_DEFINITION, {
    refetchQueries: [{ query: GET_PROPERTY_DEFINITIONS }],
  })
}

export function useUpdatePropertyDefinitionMutation() {
  return useMutation(UPDATE_PROPERTY_DEFINITION, {
    refetchQueries: [{ query: GET_PROPERTY_DEFINITIONS }],
  })
}

export function useDeletePropertyDefinitionMutation() {
  return useMutation(DELETE_PROPERTY_DEFINITION, {
    refetchQueries: [{ query: GET_PROPERTY_DEFINITIONS }],
    update: (cache, _, { variables }) => {
      if (!variables?.id) return
      cache.evict({ id: cache.identify({ __typename: 'PropertyDefinitionType', id: variables.id }) })
      cache.gc()
    },
  })
}
