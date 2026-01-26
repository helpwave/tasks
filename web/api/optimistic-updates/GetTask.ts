import { useSafeMutation } from '@/hooks/useSafeMutation'
import { fetcher } from '@/api/gql/fetcher'
import { UpdateTaskDocument, type UpdateTaskMutation, type UpdateTaskMutationVariables, type UpdateTaskInput, type FieldType } from '@/api/gql/generated'
import type { GetTaskQuery, GetTasksQuery, GetGlobalDataQuery } from '@/api/gql/generated'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useQueryClient } from '@tanstack/react-query'

interface UseOptimisticUpdateTaskMutationParams {
  id: string,
  onSuccess?: (data: UpdateTaskMutation, variables: UpdateTaskMutationVariables) => void,
  onError?: (error: Error, variables: UpdateTaskMutationVariables) => void,
}

export function useOptimisticUpdateTaskMutation({
  id,
  onSuccess,
  onError,
}: UseOptimisticUpdateTaskMutationParams) {
  const { selectedRootLocationIds } = useTasksContext()
  const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
  const queryClient = useQueryClient()

  return useSafeMutation<UpdateTaskMutation, UpdateTaskMutationVariables>({
    mutationFn: async (variables) => {
      return fetcher<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, variables)()
    },
    optimisticUpdate: (variables) => {
      const updateData = variables.data || {}
      const locationsData = queryClient.getQueryData(['GetLocations']) as { locationNodes?: Array<{ id: string, title: string, kind: string, parentId?: string | null }> } | undefined
      const usersData = queryClient.getQueryData(['GetUsers']) as { users?: Array<{ id: string, name: string, avatarUrl?: string | null, lastOnline?: unknown, isOnline?: boolean }> } | undefined
      type TaskType = NonNullable<NonNullable<ReturnType<typeof queryClient.getQueryData<GetTaskQuery>>>['task']>

      const updateTaskInQuery = (task: TaskType, updateData: Partial<UpdateTaskInput>) => {
        if (!task) return task

        const updated: typeof task = { ...task }

        if (updateData.title !== undefined) {
          updated.title = updateData.title || ''
        }
        if (updateData.description !== undefined) {
          updated.description = updateData.description
        }
        if (updateData.done !== undefined) {
          updated.done = updateData.done ?? false
        }
        if (updateData.dueDate !== undefined) {
          updated.dueDate = updateData.dueDate || null
        }
        if (updateData.priority !== undefined) {
          updated.priority = updateData.priority
        }
        if (updateData.estimatedTime !== undefined) {
          updated.estimatedTime = updateData.estimatedTime
        }
        if (updateData.assigneeId !== undefined) {
          if (updateData.assigneeId === null || updateData.assigneeId === undefined) {
            updated.assignee = null as typeof task.assignee
          } else {
            const user = usersData?.users?.find(u => u.id === updateData.assigneeId)
            if (user) {
              updated.assignee = {
                __typename: 'UserType' as const,
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                lastOnline: user.lastOnline,
                isOnline: user.isOnline ?? false,
              } as typeof task.assignee
            }
          }
        }
        if (updateData.assigneeTeamId !== undefined) {
          if (updateData.assigneeTeamId === null || updateData.assigneeTeamId === undefined) {
            updated.assigneeTeam = null as typeof task.assigneeTeam
          } else {
            const teamLocation = locationsData?.locationNodes?.find(loc => loc.id === updateData.assigneeTeamId)
            if (teamLocation) {
              updated.assigneeTeam = {
                ...teamLocation,
                __typename: 'LocationNodeType' as const,
              } as typeof task.assigneeTeam
            }
          }
        }
        if (updateData.properties !== undefined && updateData.properties !== null) {
          const propertyMap = new Map(updateData.properties.map(p => [p.definitionId, p]))
          const existingPropertyIds = new Set(
            task.properties?.map(p => p.definition?.id).filter(Boolean) || []
          )
          const newPropertyIds = new Set(updateData.properties.map(p => p.definitionId))

          const existingProperties = task.properties
            ? task.properties
              .filter(p => newPropertyIds.has(p.definition?.id))
              .map(p => {
                const newProp = propertyMap.get(p.definition?.id)
                if (!newProp) return p
                return {
                  ...p,
                  textValue: newProp.textValue ?? p.textValue,
                  numberValue: newProp.numberValue ?? p.numberValue,
                  booleanValue: newProp.booleanValue ?? p.booleanValue,
                  dateValue: newProp.dateValue ?? p.dateValue,
                  dateTimeValue: newProp.dateTimeValue ?? p.dateTimeValue,
                  selectValue: newProp.selectValue ?? p.selectValue,
                  multiSelectValues: newProp.multiSelectValues ?? p.multiSelectValues,
                }
              })
            : []
          const newProperties = updateData.properties
            .filter(p => !existingPropertyIds.has(p.definitionId))
            .map(p => {
              const existingProperty = task?.properties?.find(ep => ep.definition?.id === p.definitionId)
              return {
                __typename: 'PropertyValueType' as const,
                definition: existingProperty?.definition || {
                  __typename: 'PropertyDefinitionType' as const,
                  id: p.definitionId,
                  name: '',
                  description: null,
                  fieldType: 'TEXT' as FieldType,
                  isActive: true,
                  allowedEntities: [],
                  options: [],
                },
                textValue: p.textValue,
                numberValue: p.numberValue,
                booleanValue: p.booleanValue,
                dateValue: p.dateValue,
                dateTimeValue: p.dateTimeValue,
                selectValue: p.selectValue,
                multiSelectValues: p.multiSelectValues,
              }
            })
          updated.properties = [...existingProperties, ...newProperties]
        }

        return updated
      }

      const updates: Array<{ queryKey: unknown[], updateFn: (oldData: unknown) => unknown }> = []

      updates.push({
        queryKey: ['GetTask', { id }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetTaskQuery | undefined
          if (!data?.task) return oldData
          const updatedTask = updateTaskInQuery(data.task, updateData)
          return {
            ...data,
            task: updatedTask
          }
        }
      })

      const allGetTasksQueries = queryClient.getQueryCache().getAll()
        .filter(query => {
          const key = query.queryKey
          return Array.isArray(key) && key[0] === 'GetTasks'
        })

      for (const query of allGetTasksQueries) {
        updates.push({
          queryKey: [...query.queryKey] as unknown[],
          updateFn: (oldData: unknown) => {
            const data = oldData as GetTasksQuery | undefined
            if (!data?.tasks) return oldData
            const taskIndex = data.tasks.findIndex(t => t.id === id)
            if (taskIndex === -1) return oldData
            const task = data.tasks[taskIndex]
            if (!task) return oldData
            const updatedTask = updateTaskInQuery(task as unknown as TaskType, updateData)
            if (!updatedTask) return oldData
            const updatedTaskForList: typeof data.tasks[0] = {
              ...task,
              title: updateData.title !== undefined ? (updateData.title || '') : task.title,
              description: updateData.description !== undefined ? updateData.description : task.description,
              done: updateData.done !== undefined ? (updateData.done ?? false) : task.done,
              dueDate: updateData.dueDate !== undefined ? (updateData.dueDate || null) : task.dueDate,
              priority: updateData.priority !== undefined ? updateData.priority : task.priority,
              estimatedTime: updateData.estimatedTime !== undefined ? updateData.estimatedTime : task.estimatedTime,
              assignee: updateData.assigneeId !== undefined
                ? (updateData.assigneeId
                  ? (usersData?.users?.find(u => u.id === updateData.assigneeId) ? {
                    __typename: 'UserType' as const,
                    id: updateData.assigneeId,
                    name: usersData.users.find(u => u.id === updateData.assigneeId)!.name,
                    avatarUrl: usersData.users.find(u => u.id === updateData.assigneeId)!.avatarUrl,
                    lastOnline: usersData.users.find(u => u.id === updateData.assigneeId)!.lastOnline,
                    isOnline: usersData.users.find(u => u.id === updateData.assigneeId)!.isOnline ?? false,
                  } as typeof task.assignee : task.assignee)
                  : (null as typeof task.assignee))
                : task.assignee,
              assigneeTeam: updateData.assigneeTeamId !== undefined
                ? (updateData.assigneeTeamId
                  ? (locationsData?.locationNodes?.find(loc => loc.id === updateData.assigneeTeamId) ? {
                    __typename: 'LocationNodeType' as const,
                    id: updateData.assigneeTeamId,
                    title: locationsData.locationNodes!.find(loc => loc.id === updateData.assigneeTeamId)!.title,
                    kind: locationsData.locationNodes!.find(loc => loc.id === updateData.assigneeTeamId)!.kind,
                  } as typeof task.assigneeTeam : task.assigneeTeam)
                  : (null as typeof task.assigneeTeam))
                : task.assigneeTeam,
            }
            return {
              ...data,
              tasks: [
                ...data.tasks.slice(0, taskIndex),
                updatedTaskForList,
                ...data.tasks.slice(taskIndex + 1)
              ]
            }
          }
        })
      }

      updates.push({
        queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }],
        updateFn: (oldData: unknown) => {
          const data = oldData as GetGlobalDataQuery | undefined
          if (!data) return oldData
          const existingTask = data.me?.tasks?.find(t => t.id === id)
          if (!existingTask) return oldData
          const updatedTask = updateTaskInQuery(existingTask as unknown as TaskType, updateData)
          return {
            ...data,
            me: data.me ? {
              ...data.me,
              tasks: data.me.tasks?.map(t => t.id === id ? updatedTask as typeof existingTask : t) || []
            } : null
          }
        }
      })

      updates.push({
        queryKey: ['GetOverviewData'],
        updateFn: (oldData: unknown) => {
          return oldData
        }
      })

      return updates
    },
    affectedQueryKeys: [
      ['GetTask', { id }],
      ['GetTasks'],
      ['GetOverviewData'],
      ['GetGlobalData']
    ],
    onSuccess,
    onError,
  })
}
