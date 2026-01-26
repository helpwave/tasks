import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_PROPERTY_DEFINITIONS = gql`
  query GetPropertyDefinitions {
    propertyDefinitions {
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

export const GET_PROPERTIES_FOR_SUBJECT = gql`
  query GetPropertiesForSubject($subjectId: ID!, $subjectType: PropertyEntity!) {
    propertyDefinitions {
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

export interface GetPropertyDefinitionsVariables {
}

export interface GetPropertyDefinitionsData {
  propertyDefinitions: Array<{
    __typename?: 'PropertyDefinitionType'
    id: string
    name: string
    description?: string | null
    fieldType: string
    isActive: boolean
    allowedEntities: Array<string>
    options: Array<string>
  }>
}

export interface GetPropertiesForSubjectVariables {
  subjectId: string
  subjectType: string
}

export interface GetPropertiesForSubjectData {
  propertyDefinitions: Array<{
    __typename?: 'PropertyDefinitionType'
    id: string
    name: string
    description?: string | null
    fieldType: string
    isActive: boolean
    allowedEntities: Array<string>
    options: Array<string>
  }>
}

export const useGetPropertyDefinitionsQuery = createQueryHook<GetPropertyDefinitionsData, GetPropertyDefinitionsVariables>(GET_PROPERTY_DEFINITIONS)
export const useGetPropertiesForSubjectQuery = createQueryHook<GetPropertiesForSubjectData, GetPropertiesForSubjectVariables>(GET_PROPERTIES_FOR_SUBJECT)
