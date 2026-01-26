import { ApolloCache, gql } from '@apollo/client'
import type {
  CompleteTaskMutation,
  CompleteTaskMutationVariables,
  ReopenTaskMutation,
  ReopenTaskMutationVariables,
  CreateTaskMutation,
  CreateTaskMutationVariables,
  UpdateTaskMutation,
  UpdateTaskMutationVariables,
  DeleteTaskMutation,
  DeleteTaskMutationVariables,
  AssignTaskMutation,
  AssignTaskMutationVariables,
  UnassignTaskMutation,
  UnassignTaskMutationVariables,
  AssignTaskToTeamMutation,
  AssignTaskToTeamMutationVariables,
  UnassignTaskFromTeamMutation,
  UnassignTaskFromTeamMutationVariables,
  GetTaskQuery,
  GetTasksQuery,
  GetGlobalDataQuery,
  GetPatientQuery,
  TaskType,
} from '@/api/gql/generated'
import { useCompleteTaskMutation, useReopenTaskMutation, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useAssignTaskMutation, useUnassignTaskMutation, useAssignTaskToTeamMutation, useUnassignTaskFromTeamMutation } from '@/api/gql/generated'
import { useTasksContext } from '@/hooks/useTasksContext'
import { GetTaskDocument, GetTasksDocument, GetGlobalDataDocument, GetPatientDocument } from '@/api/gql/generated'

export function useOptimisticCompleteTaskMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useCompleteTaskMutation({
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
          updateDate: () => new Date().toISOString(),
        },
      })

      const globalData = cache.readQuery<GetGlobalDataQuery>({
        query: GetGlobalDataDocument,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData?.me?.tasks) {
        cache.writeQuery({
          query: GetGlobalDataDocument,
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

export function useOptimisticReopenTaskMutation() {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useReopenTaskMutation({
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
          updateDate: () => new Date().toISOString(),
        },
      })

      const globalData = cache.readQuery<GetGlobalDataQuery>({
        query: GetGlobalDataDocument,
        variables: { rootLocationIds: selectedRootLocationIdsForQuery },
      })

      if (globalData?.me?.tasks) {
        cache.writeQuery({
          query: GetGlobalDataDocument,
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

export function useOptimisticCreateTaskMutation() {
  return useCreateTaskMutation({
    update: (cache, { data }) => {
      if (!data?.createTask) return

      cache.modify({
        fields: {
          tasks(existingTasks = [], { readField }) {
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
            return [...existingTasks, newTaskRef]
          },
        },
      })
    },
  })
}

export function useOptimisticUpdateTaskMutation(taskId: string) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined

  return useUpdateTaskMutation({
    optimisticResponse: (variables) => {
      return {
        updateTask: {
          __typename: 'TaskType',
          id: taskId,
          ...variables.data,
        } as any,
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

export function useOptimisticDeleteTaskMutation() {
  return useDeleteTaskMutation({
    update: (cache, { data }, { variables }) => {
      if (!variables?.id) return

      cache.evict({ id: cache.identify({ __typename: 'TaskType', id: variables.id }) })
      cache.gc()
    },
  })
}

export function useOptimisticAssignTaskMutation() {
  return useAssignTaskMutation({
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

export function useOptimisticUnassignTaskMutation() {
  return useUnassignTaskMutation({
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

export function useOptimisticAssignTaskToTeamMutation() {
  return useAssignTaskToTeamMutation({
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

export function useOptimisticUnassignTaskFromTeamMutation() {
  return useUnassignTaskFromTeamMutation({
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
