import { gql } from '@apollo/client'
import { createQueryHook } from './base'

export const GET_TASK = gql`
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      checksum
      patient {
        id
        name
      }
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

export const GET_TASKS = gql`
  query GetTasks(
    $rootLocationIds: [ID!]
    $assigneeId: ID
    $assigneeTeamId: ID
    $filtering: [FilterInput!]
    $sorting: [SortInput!]
    $pagination: PaginationInput
    $search: FullTextSearchInput
  ) {
    tasks(
      rootLocationIds: $rootLocationIds
      assigneeId: $assigneeId
      assigneeTeamId: $assigneeTeamId
      filtering: $filtering
      sorting: $sorting
      pagination: $pagination
      search: $search
    ) {
      data {
        id
        title
        description
        done
        dueDate
        priority
        estimatedTime
        creationDate
        updateDate
        patient {
          id
          name
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
              }
            }
          }
        }
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

export const GET_MY_TASKS = gql`
  query GetMyTasks {
    me {
      id
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
        patient {
          id
          name
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
              }
            }
          }
        }
        assignee {
          id
          name
          avatarUrl
          lastOnline
          isOnline
        }
      }
    }
  }
`

export interface GetTaskVariables {
  id: string
}

export interface GetTaskData {
  task?: {
    __typename?: 'TaskType'
    id: string
    title: string
    description?: string | null
    done: boolean
    dueDate?: string | null
    priority?: string | null
    estimatedTime?: number | null
    checksum: string
    patient: {
      __typename?: 'PatientType'
      id: string
      name: string
    }
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

export interface GetTasksVariables {
  rootLocationIds?: string[] | null
  assigneeId?: string | null
  assigneeTeamId?: string | null
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

export interface GetTasksData {
  tasks: {
    __typename?: 'TasksResponse'
    totalCount: number
    data: Array<{
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
      patient: {
        __typename?: 'PatientType'
        id: string
        name: string
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
      }
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

export interface GetMyTasksVariables {
}

export interface GetMyTasksData {
  me?: {
    __typename?: 'UserType'
    id: string
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
      patient: {
        __typename?: 'PatientType'
        id: string
        name: string
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
      }
      assignee?: {
        __typename?: 'UserType'
        id: string
        name: string
        avatarUrl?: string | null
        lastOnline?: string | null
        isOnline: boolean
      } | null
    }>
  } | null
}

export const useGetTaskQuery = createQueryHook<GetTaskData, GetTaskVariables>(GET_TASK)
export const useGetTasksQuery = createQueryHook<GetTasksData, GetTasksVariables>(GET_TASKS)
export const useGetMyTasksQuery = createQueryHook<GetMyTasksData, GetMyTasksVariables>(GET_MY_TASKS)
