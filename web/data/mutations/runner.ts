import type { ApolloClient } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import { print } from 'graphql'
import { extractConflictError } from '@/utils/graphql'
import { addPendingMutation, removePendingMutation } from './queue'
import type { PendingMutationRecord } from './types'
import type { MutateOptimisticOptions, OptimisticPatch } from './types'
import { schedulePersistCache } from '../cache/persist'
import {
  clearEntityMutated,
  markEntityMutated
} from '../subscriptions/handler'
import * as storage from '../storage/indexed-db'

function generateClientMutationId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cm-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export async function mutateOptimistic<TData, TVariables>(
  client: ApolloClient,
  options: MutateOptimisticOptions<TData, TVariables>
): Promise<TData> {
  const {
    document,
    variables: rawVariables,
    optimisticPlan,
    optimisticPlanKey,
    onSuccess,
    onError,
    onConflict,
  } = options

  const clientMutationId = (rawVariables as Record<string, unknown>)['clientMutationId'] as
    | string
    | undefined
  const resolvedId = clientMutationId ?? generateClientMutationId()
  const variables = {
    ...rawVariables,
    clientMutationId: resolvedId,
  } as TVariables & { clientMutationId: string }

  const record: PendingMutationRecord = {
    clientMutationId: resolvedId,
    document: print(document as DocumentNode),
    variables,
    optimisticPlanKey,
    createdAt: Date.now(),
  }
  addPendingMutation(record)
  if (typeof window !== 'undefined') {
    await storage.addPendingMutation(record).catch(() => {})
  }

  const vars = variables as Record<string, unknown>
  const entityType = options.entityType ?? 'Task'
  if (typeof vars?.['id'] === 'string') {
    markEntityMutated(entityType, vars['id'], resolvedId)
  }

  const cache = client.cache
  let patches: OptimisticPatch[] = []
  try {
    patches = optimisticPlan.getPatches(variables)
    for (const patch of patches) {
      patch.apply(cache, variables)
    }
  } catch (applyError) {
    removePendingMutation(resolvedId)
    if (typeof window !== 'undefined') {
      storage.removePendingMutation(resolvedId).catch(() => {})
    }
    throw applyError
  }

  try {
    const result = await client.mutate<TData, TVariables & { clientMutationId?: string }>({
      mutation: document as DocumentNode,
      variables,
    })
    if (result.data === undefined) {
      throw new Error('Mutation returned no data')
    }
    removePendingMutation(resolvedId)
    if (typeof window !== 'undefined') {
      storage.removePendingMutation(resolvedId).catch(() => {})
    }
    if (typeof vars?.['id'] === 'string') {
      clearEntityMutated('Task', vars['id'])
    }
    onSuccess?.(result.data, variables)
    schedulePersistCache(cache)
    return result.data
  } catch (error) {
    for (const patch of patches) {
      try {
        patch.rollback(cache, variables)
      } catch {
        //
      }
    }
    removePendingMutation(resolvedId)
    if (typeof window !== 'undefined') {
      storage.removePendingMutation(resolvedId).catch(() => {})
    }
    if (typeof vars?.['id'] === 'string') {
      clearEntityMutated(entityType, vars['id'])
    }

    const err = error instanceof Error ? error : new Error(String(error))
    const conflictInfo = extractConflictError(error)

    if (conflictInfo.isConflict && onConflict) {
      try {
        const choice = await onConflict(err, variables)
        if (choice === 'retry') {
          const cleaned = { ...variables } as Record<string, unknown>
          delete cleaned['clientMutationId']
          return mutateOptimistic(client, {
            ...options,
            variables: cleaned as TVariables & { clientMutationId?: string },
          })
        }
        if (choice === 'use-server') {
          await client.refetchQueries({ include: 'active' })
        }
      } catch (conflictErr) {
        onError?.(
          conflictErr instanceof Error ? conflictErr : new Error(String(conflictErr)),
          variables
        )
        throw conflictErr
      }
    } else {
      onError?.(err, variables)
    }
    throw error
  }
}
