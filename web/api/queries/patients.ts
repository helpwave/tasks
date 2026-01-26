import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patient(id: $id) {
      id
      firstname
      lastname
      birthdate
      sex
      state
      description
      checksum
      assignedLocation {
        id
        title
      }
      assignedLocations {
        id
        title
      }
      clinic {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      position {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      teams {
        id
        title
        kind
        parent {
          id
          title
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
      }
      tasks {
        id
        title
        description
        done
        dueDate
        priority
        estimatedTime
        updateDate
        assignee {
          id
          name
          avatarUrl
          lastOnline
          isOnline
        }
        assigneeTeam {
          id
          title
          kind
        }
      }
      properties {
        definition {
          id
          name
          description
          fieldType
          isActive
          allowedEntities
          options
        }
        textValue
        numberValue
        booleanValue
        dateValue
        dateTimeValue
        selectValue
        multiSelectValues
      }
    }
  }
`

export const GET_PATIENTS = gql`
  query GetPatients(
    $locationId: ID
    $rootLocationIds: [ID!]
    $states: [PatientState!]
    $filtering: [FilterInput!]
    $sorting: [SortInput!]
    $pagination: PaginationInput
    $search: FullTextSearchInput
  ) {
    patients(
      locationNodeId: $locationId
      rootLocationIds: $rootLocationIds
      states: $states
      filtering: $filtering
      sorting: $sorting
      pagination: $pagination
      search: $search
    ) {
      data {
        id
        name
        firstname
        lastname
        birthdate
        sex
        state
        assignedLocation {
          id
          title
          parent {
            id
            title
          }
        }
        assignedLocations {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
              }
            }
          }
        }
        clinic {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
                parent {
                  id
                  title
                }
              }
            }
          }
        }
        position {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
                parent {
                  id
                  title
                }
              }
            }
          }
        }
        teams {
          id
          title
          kind
          parent {
            id
            title
            parent {
              id
              title
              parent {
                id
                title
                parent {
                  id
                  title
                }
              }
            }
          }
        }
        tasks {
          id
          title
          description
          done
          dueDate
          priority
          estimatedTime
          creationDate
          updateDate
          assignee {
            id
            name
            avatarUrl
            lastOnline
            isOnline
          }
          assigneeTeam {
            id
            title
            kind
          }
        }
        properties {
          definition {
            id
            name
            description
            fieldType
            isActive
            allowedEntities
            options
          }
          textValue
          numberValue
          booleanValue
          dateValue
          dateTimeValue
          selectValue
          multiSelectValues
        }
      }
      totalCount
    }
  }
`

export interface GetPatientVariables {
  id: string
}

export interface GetPatientData {
  patient?: {
    __typename?: 'PatientType'
    id: string
    firstname: string
    lastname: string
    birthdate: string
    sex: string
    state: string
    description?: string | null
    checksum: string
    assignedLocation?: {
      __typename?: 'LocationNodeType'
      id: string
      title: string
    } | null
    assignedLocations: Array<{
      __typename?: 'LocationNodeType'
      id: string
      title: string
    }>
    clinic: {
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
      parent?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
            } | null
          } | null
        } | null
      } | null
    }
    position?: {
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
      parent?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
            } | null
          } | null
        } | null
      } | null
    } | null
    teams: Array<{
      __typename?: 'LocationNodeType'
      id: string
      title: string
      kind: string
      parent?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
            } | null
          } | null
        } | null
      } | null
    }>
    tasks: Array<{
      __typename?: 'TaskType'
      id: string
      title: string
      description?: string | null
      done: boolean
      dueDate?: string | null
      priority?: string | null
      estimatedTime?: number | null
      updateDate?: string | null
      assignee?: {
        __typename?: 'UserType'
        id: string
        name: string
        avatarUrl?: string | null
        lastOnline?: string | null
        isOnline: boolean
      } | null
      assigneeTeam?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
      } | null
    }>
    properties: Array<{
      __typename?: 'PropertyValueType'
      textValue?: string | null
      numberValue?: number | null
      booleanValue?: boolean | null
      dateValue?: string | null
      dateTimeValue?: string | null
      selectValue?: string | null
      multiSelectValues?: Array<string> | null
      definition: {
        __typename?: 'PropertyDefinitionType'
        id: string
        name: string
        description?: string | null
        fieldType: string
        isActive: boolean
        allowedEntities: Array<string>
        options: Array<string>
      }
    }>
  } | null
}

export interface GetPatientsVariables {
  locationId?: string | null
  rootLocationIds?: string[] | null
  states?: Array<string> | null
  filtering?: Array<{
    column: string
    columnType?: string | null
    operator: string
    parameter: {
      compareDate?: string | null
      compareDateTime?: string | null
      compareValue?: number | null
      isCaseSensitive?: boolean
      max?: number | null
      maxDate?: string | null
      maxDateTime?: string | null
      min?: number | null
      minDate?: string | null
      minDateTime?: string | null
      propertyDefinitionId?: string | null
      searchTags?: Array<string> | null
      searchText?: string | null
    }
    propertyDefinitionId?: string | null
  }> | null
  sorting?: Array<{
    column: string
    direction: string
    propertyDefinitionId?: string | null
  }> | null
  pagination?: {
    limit?: number | null
    offset?: number | null
  } | null
  search?: {
    includeProperties?: boolean
    propertyDefinitionIds?: Array<string> | null
    searchColumns?: Array<string> | null
    searchText: string
  } | null
}

export interface GetPatientsData {
  patients: {
    __typename?: 'PatientsResponse'
    totalCount: number
    data: Array<{
      __typename?: 'PatientType'
      id: string
      name: string
      firstname: string
      lastname: string
      birthdate: string
      sex: string
      state: string
      assignedLocation?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
        } | null
      } | null
      assignedLocations: Array<{
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
          } | null
        } | null
      }>
      clinic: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
              parent?: {
                __typename?: 'LocationNodeType'
                id: string
                title: string
              } | null
            } | null
          } | null
        } | null
      }
      position?: {
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
              parent?: {
                __typename?: 'LocationNodeType'
                id: string
                title: string
              } | null
            } | null
          } | null
        } | null
      } | null
      teams: Array<{
        __typename?: 'LocationNodeType'
        id: string
        title: string
        kind: string
        parent?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          parent?: {
            __typename?: 'LocationNodeType'
            id: string
            title: string
            parent?: {
              __typename?: 'LocationNodeType'
              id: string
              title: string
              parent?: {
                __typename?: 'LocationNodeType'
                id: string
                title: string
              } | null
            } | null
          } | null
        } | null
      }>
      tasks: Array<{
        __typename?: 'TaskType'
        id: string
        title: string
        description?: string | null
        done: boolean
        dueDate?: string | null
        priority?: string | null
        estimatedTime?: number | null
        creationDate: string
        updateDate?: string | null
        assignee?: {
          __typename?: 'UserType'
          id: string
          name: string
          avatarUrl?: string | null
          lastOnline?: string | null
          isOnline: boolean
        } | null
        assigneeTeam?: {
          __typename?: 'LocationNodeType'
          id: string
          title: string
          kind: string
        } | null
      }>
      properties: Array<{
        __typename?: 'PropertyValueType'
        textValue?: string | null
        numberValue?: number | null
        booleanValue?: boolean | null
        dateValue?: string | null
        dateTimeValue?: string | null
        selectValue?: string | null
        multiSelectValues?: Array<string> | null
        definition: {
          __typename?: 'PropertyDefinitionType'
          id: string
          name: string
          description?: string | null
          fieldType: string
          isActive: boolean
          allowedEntities: Array<string>
          options: Array<string>
        }
      }>
    }>
  }
}

export const useGetPatientQuery = createQueryHook<GetPatientData, GetPatientVariables>(GET_PATIENT)
export const useGetPatientsQuery = createQueryHook<GetPatientsData, GetPatientsVariables>(GET_PATIENTS)
