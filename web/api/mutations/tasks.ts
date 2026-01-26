import { gql, useMutation } from '@apollo/client/react'
import { GET_TASK, GET_TASKS, GET_MY_TASKS, GET_GLOBAL_DATA } from '../queries/tasks'
import { GET_PATIENT } from '../queries/patients'
import { useTasksContext } from '@/hooks/useTasksContext'
import { apolloClient } from '@/utils/apolloClient'

export const CREATE_TASK = gql`
  mutation CreateTask($data: CreateTaskInput!) {
    createTask(data: $data) {
      id
      title
      description
      done
      dueDate
      updateDate
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
      patient {
        id
        name
      }
    }
  }
`

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $data: UpdateTaskInput!) {
    updateTask(id: $id, data: $data) {
      id
      title
      description
      done
      dueDate
      priority
      estimatedTime
      updateDate
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

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`

export const COMPLETE_TASK = gql`
  mutation CompleteTask($id: ID!) {
    completeTask(id: $id) {
      id
      done
      updateDate
    }
  }
`

export const REOPEN_TASK = gql`
  mutation ReopenTask($id: ID!) {
    reopenTask(id: $id) {
      id
      done
      updateDate
    }
  }
`

export const ASSIGN_TASK = gql`
  mutation AssignTask($id: ID!, $userId: ID!) {
    assignTask(id: $id, userId: $userId) {
      id
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
    }
  }
`

export const UNASSIGN_TASK = gql`
  mutation UnassignTask($id: ID!) {
    unassignTask(id: $id) {
      id
      assignee {
        id
        name
        avatarUrl
        lastOnline
        isOnline
      }
    }
  }
`

export const ASSIGN_TASK_TO_TEAM = gql`
  mutation AssignTaskToTeam($id: ID!, $teamId: ID!) {
    assignTaskToTeam(id: $id, teamId: $teamId) {
      id
      assigneeTeam {
        id
        title
        kind
      }
    }
  }
`

export const UNASSIGN_TASK_FROM_TEAM = gql`
  mutation UnassignTaskFromTeam($id: ID!) {
    unassignTaskFromTeam(id: $id) {
      id
      assigneeTeam {
        id
        title
        kind
      }
    }
  }
`

export interface CreateTaskVariables {
  data: {
    title: string
    patientId: string
    description?: string | null
    assigneeId?: string | null
    assigneeTeamId?: string | null
    dueDate?: string | null
    priority?: string | null
    estimatedTime?: number | null
    properties?: Array<{
      definitionId: string
      textValue?: string | null
      numberValue?: number | null
      booleanValue?: boolean | null
      dateValue?: string | null
      dateTimeValue?: string | null
      selectValue?: string | null
      multiSelectValues?: Array<string> | null
    }> | null
    previousTaskIds?: Array<string> | null
  }
}

export interface UpdateTaskVariables {
  id: string
  data: {
    title?: string | null
    description?: string | null
    done?: boolean | null
    dueDate?: string | null
    priority?: string | null
    estimatedTime?: number | null
    assigneeId?: string | null
    assigneeTeamId?: string | null
    properties?: Array<{
      definitionId: string
      textValue?: string | null
      numberValue?: number | null
      booleanValue?: boolean | null
      dateValue?: string | null
      dateTimeValue?: string | null
      selectValue?: string | null
      multiSelectValues?: Array<string> | null
    }> | null
  }
}

export interface DeleteTaskVariables {
  id: string
}

export interface CompleteTaskVariables {
  id: string
}

export interface ReopenTaskVariables {
  id: string
}

export interface AssignTaskVariables {
  id: string
  userId: string
}

export interface UnassignTaskVariables {
  id: string
}

export interface AssignTaskToTeamVariables {
  id: string
  teamId: string
}

export interface UnassignTaskFromTeamVariables {
  id: string
}

export function useCreateTaskMutation() {
  return useMutation(CREATE_TASK, {
    update: (cache, { data }) => {
      if (!data?.createTask) return
      cache.modify({
        fields: {
          tasks(existingTasks = { data: [], totalCount: 0 }, { readField }) {
            const newTaskRef = cache.writeFragment({
              data: data.createTask,
              fragment: gql`
                fragment NewTask on TaskType {
                  id
                  title
                  description
                  done
                  dueDate
                  updateDate
                  assignee {
                    id
                    name
                    avatarUrl
                    lastOnline
                    isOnline
                  }
                  patient {
                    id
                    name
                  }
                }
              `,
            })
            return {
              ...existingTasks,
              data: [...existingTasks.data, newTaskRef],
              totalCount: existingTasks.totalCount + 1,
            }
          },
        },
      })
    },
  })
}

export function useUpdateTaskMutation(taskId: string) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(UPDATE_TASK, {
    optimisticResponse: (variables) => {
      const cache = apolloClient.cache
      const existingTask = cache.readQuery({
        query: GET_TASK,
        variables: { id: taskId },
      })?.task

      if (!existingTask) return undefined

      return {
        updateTask: {
          __typename: 'TaskType',
          id: taskId,
          ...existingTask,
          ...variables.data,
        },
      }
    },
    update: (cache, { data }) => {
      if (!data?.updateTask) return

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: data.updateTask.id }),
        fields: {
          title: () => data.updateTask.title,
          description: () => data.updateTask.description,
          done: () => data.updateTask.done,
          dueDate: () => data.updateTask.dueDate,
          priority: () => data.updateTask.priority,
          estimatedTime: () => data.updateTask.estimatedTime,
          assignee: () => data.updateTask.assignee,
          assigneeTeam: () => data.updateTask.assigneeTeam,
          properties: () => data.updateTask.properties,
        },
      })
    },
  })
}

export function useDeleteTaskMutation() {
  return useMutation(DELETE_TASK, {
    update: (cache, _, { variables }) => {
      if (!variables?.id) return
      cache.evict({ id: cache.identify({ __typename: 'TaskType', id: variables.id }) })
      cache.gc()
    },
  })
}

export function useCompleteTaskMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(COMPLETE_TASK, {
    optimisticResponse: (variables) => ({
      completeTask: {
        __typename: 'TaskType',
        id: variables.id,
        done: true,
        updateDate: new Date().toISOString(),
      },
    }),
    update: (cache, { data }) => {
      if (!data?.completeTask) return

      const taskId = data.completeTask.id

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: taskId }),
        fields: {
          done: () => true,
          updateDate: () => data.completeTask.updateDate,
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData?.me?.tasks) {
        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            me: {
              ...globalData.me,
              tasks: globalData.me.tasks.map(task =>
                task.id === taskId ? { ...task, done: true } : task
              ),
            },
          },
        })
      }
    },
  })
}

export function useReopenTaskMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useMutation(REOPEN_TASK, {
    optimisticResponse: (variables) => ({
      reopenTask: {
        __typename: 'TaskType',
        id: variables.id,
        done: false,
        updateDate: new Date().toISOString(),
      },
    }),
    update: (cache, { data }) => {
      if (!data?.reopenTask) return

      const taskId = data.reopenTask.id

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: taskId }),
        fields: {
          done: () => false,
          updateDate: () => data.reopenTask.updateDate,
        },
      })

      const globalData = cache.readQuery({
        query: GET_GLOBAL_DATA,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData?.me?.tasks) {
        cache.writeQuery({
          query: GET_GLOBAL_DATA,
          variables: { rootLocationIds: selectedRootLocationIdsForQuery },
          data: {
            ...globalData,
            me: {
              ...globalData.me,
              tasks: globalData.me.tasks.map(task =>
                task.id === taskId ? { ...task, done: false } : task
              ),
            },
          },
        })
      }
    },
  })
}

export function useAssignTaskMutation() {
  return useMutation(ASSIGN_TASK, {
    update: (cache, { data }) => {
      if (!data?.assignTask) return

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: data.assignTask.id }),
        fields: {
          assignee: () => data.assignTask.assignee,
        },
      })
    },
  })
}

export function useUnassignTaskMutation() {
  return useMutation(UNASSIGN_TASK, {
    update: (cache, { data }) => {
      if (!data?.unassignTask) return

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: data.unassignTask.id }),
        fields: {
          assignee: () => null,
        },
      })
    },
  })
}

export function useAssignTaskToTeamMutation() {
  return useMutation(ASSIGN_TASK_TO_TEAM, {
    update: (cache, { data }) => {
      if (!data?.assignTaskToTeam) return

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: data.assignTaskToTeam.id }),
        fields: {
          assigneeTeam: () => data.assignTaskToTeam.assigneeTeam,
        },
      })
    },
  })
}

export function useUnassignTaskFromTeamMutation() {
  return useMutation(UNASSIGN_TASK_FROM_TEAM, {
    update: (cache, { data }) => {
      if (!data?.unassignTaskFromTeam) return

      cache.modify({
        id: cache.identify({ __typename: 'TaskType', id: data.unassignTaskFromTeam.id }),
        fields: {
          assigneeTeam: () => null,
        },
      })
    },
  })
}
