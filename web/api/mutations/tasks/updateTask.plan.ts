import type { ApolloCache } from '@apollo/client/cache'
import {
  GetTaskDocument,
  LocationType,
  type GetTaskQuery,
  type UpdateTaskInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'
import { buildOptimisticProperties, readEntityProperties, applyOptimisticPropertyScalars, getNewOptimisticProperties } from '@/api/mutations/shared/optimisticProperties'

type UpdateTaskVariables = {
  id: string,
  data: UpdateTaskInput,
  clientMutationId?: string,
}

type TaskEntity = NonNullable<GetTaskQuery['task']>

function optimisticAssignees(
  assigneeIds: string[] | null | undefined,
  previous: TaskEntity['assignees'] | undefined
): TaskEntity['assignees'] | undefined {
  if (assigneeIds === undefined) return undefined
  const prev = previous ?? []
  const ids = assigneeIds ?? []
  return ids.map((userId) => {
    const found = prev.find((u) => u.id === userId)
    if (found) return found
    return {
      __typename: 'UserType' as const,
      id: userId,
      name: '',
      avatarUrl: null,
      lastOnline: null,
      isOnline: false,
    }
  })
}

function optimisticAssigneeTeam(
  assigneeTeamId: string | null | undefined,
  previous: TaskEntity['assigneeTeam'] | undefined
): TaskEntity['assigneeTeam'] | null | undefined {
  if (assigneeTeamId === undefined) return undefined
  if (assigneeTeamId === null) return null
  if (previous?.id === assigneeTeamId) return previous
  return {
    __typename: 'LocationNodeType' as const,
    id: assigneeTeamId,
    title: '',
    kind: LocationType.Team,
  }
}

export const updateTaskOptimisticPlanKey = 'UpdateTask'

export const updateTaskOptimisticPlan: OptimisticPlan<UpdateTaskVariables> = {
  getPatches(variables): OptimisticPatch[] {
    const snapshotRef: { current: GetTaskQuery | null } = { current: null }
    const taskId = variables.id
    const data = variables.data
    const doc = getParsedDocument(GetTaskDocument)

    return [
      {
        apply(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdateTaskVariables
          const existing = cache.readQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
          })
          snapshotRef.current = existing ?? null

          const id = cache.identify({ __typename: 'TaskType', id: taskId })
          const existingTask = existing?.task
          // Read the current properties from the normalized entity (populated by
          // the list query) so real property uuids are preserved even when the
          // task detail query was never run.
          const fields: Record<string, (prev: unknown, details: { readField: (field: string) => unknown }) => unknown> = {
            title: (prev) =>
              data.title !== undefined ? data.title ?? '' : (prev as string),
            description: (prev) =>
              data.description !== undefined ? data.description : (prev as string | null),
            done: (prev) =>
              data.done !== undefined ? data.done ?? false : (prev as boolean),
            dueDate: (prev) =>
              data.dueDate !== undefined ? data.dueDate ?? null : (prev as string | null),
            priority: (prev) =>
              data.priority !== undefined ? data.priority : (prev as string | null),
            estimatedTime: (prev) =>
              data.estimatedTime !== undefined ? data.estimatedTime : (prev as number | null),
            assignees: (prev) => {
              const next = optimisticAssignees(data.assigneeIds, existingTask?.assignees)
              return next !== undefined ? next : prev
            },
            assigneeTeam: (prev) => {
              const next = optimisticAssigneeTeam(
                data.assigneeTeamId,
                existingTask?.assigneeTeam
              )
              return next !== undefined ? next : prev
            },
          }
          if (data.properties !== undefined) {
            const existingProps = readEntityProperties(cache, 'TaskType', taskId)
            const optimisticProperties = buildOptimisticProperties(existingProps, data.properties, taskId)
            applyOptimisticPropertyScalars(cache, optimisticProperties)
            const newProperties = getNewOptimisticProperties(optimisticProperties)
            if (newProperties.length > 0) {
              fields['properties'] = (existing, details) => {
                const { toReference } = details as unknown as {
                  toReference: (obj: unknown, mergeIntoStore?: boolean) => unknown,
                }
                const current = Array.isArray(existing) ? existing : []
                const newRefs = newProperties.flatMap((property) => {
                  const ref = toReference(property, true)
                  return ref ? [ref] : []
                })
                return [...current, ...newRefs]
              }
            }
          }
          cache.modify({
            id,
            fields,
          })
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              tasks(existing, { readField }) {
                if (!Array.isArray(existing)) return existing
                const hasTask = existing.some(
                  (ref) => readField('id', ref) === taskId
                )
                if (!hasTask) return existing
                return [...existing]
              },
            },
          })
        },
        rollback(cache: ApolloCache, vars: unknown): void {
          const v = vars as UpdateTaskVariables
          const previous = snapshotRef.current
          if (!previous) return
          cache.writeQuery<GetTaskQuery>({
            query: doc,
            variables: { id: v.id },
            data: previous,
          })
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              tasks(existing) {
                if (!Array.isArray(existing)) return existing
                return [...existing]
              },
            },
          })
        },
      },
    ]
  },
}

registerOptimisticPlan(updateTaskOptimisticPlanKey, updateTaskOptimisticPlan as OptimisticPlan<unknown>)
