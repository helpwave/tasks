import type { ApolloCache } from '@apollo/client/cache'
import type { Reference } from '@apollo/client/utilities'
import {
  GetTaskDocument,
  LocationType,
  type GetTaskQuery,
  type UpdateTaskInput
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { registerOptimisticPlan } from '@/data/mutations/registry'
import type { OptimisticPlan, OptimisticPatch } from '@/data/mutations/types'

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
          const existingProps = existingTask?.properties ?? []
          const mergeProperties = (_prev: Reference | readonly unknown[]) => {
            if (!data.properties) return existingProps
            return data.properties.map((inp) => {
              const existingProp = existingProps.find(
                (p) => (p as { definition: { id: string } }).definition.id === inp.definitionId
              )
              if (existingProp) {
                const cur = existingProp as Record<string, unknown>
                return {
                  ...cur,
                  textValue: inp.textValue ?? cur['textValue'] ?? null,
                  numberValue: inp.numberValue ?? cur['numberValue'] ?? null,
                  booleanValue: inp.booleanValue ?? cur['booleanValue'] ?? null,
                  dateValue: inp.dateValue ?? cur['dateValue'] ?? null,
                  dateTimeValue: inp.dateTimeValue ?? cur['dateTimeValue'] ?? null,
                  selectValue: inp.selectValue ?? cur['selectValue'] ?? null,
                  multiSelectValues: inp.multiSelectValues ?? cur['multiSelectValues'] ?? null,
                  userValue: inp.userValue ?? cur['userValue'] ?? null,
                }
              }
              return {
                __typename: 'PropertyValueType',
                id: `attachment-${taskId}-${inp.definitionId}`,
                definition: { __ref: `PropertyDefinitionType:${inp.definitionId}` },
                textValue: inp.textValue ?? null,
                numberValue: inp.numberValue ?? null,
                booleanValue: inp.booleanValue ?? null,
                dateValue: inp.dateValue ?? null,
                dateTimeValue: inp.dateTimeValue ?? null,
                selectValue: inp.selectValue ?? null,
                multiSelectValues: inp.multiSelectValues ?? null,
                userValue: inp.userValue ?? null,
              }
            })
          }
          cache.modify({
            id,
            fields: {
              title: (prev: string) =>
                data.title !== undefined ? data.title ?? '' : prev,
              description: (prev: string | null) =>
                data.description !== undefined ? data.description : prev,
              done: (prev: boolean) =>
                data.done !== undefined ? data.done ?? false : prev,
              dueDate: (prev: string | null) =>
                data.dueDate !== undefined ? data.dueDate ?? null : prev,
              priority: (prev: string | null) =>
                data.priority !== undefined ? data.priority : prev,
              estimatedTime: (prev: number | null) =>
                data.estimatedTime !== undefined ? data.estimatedTime : prev,
              properties: mergeProperties,
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
            },
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
