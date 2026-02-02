import type { DocumentNode } from 'graphql'
import type { ApolloCache } from '@apollo/client/cache'

export type ClientMutationId = string

export type OptimisticPatch = {
  apply: (cache: ApolloCache, variables: unknown) => void,
  rollback: (cache: ApolloCache, variables: unknown) => void,
}

export type OptimisticPlan<TVariables = unknown> = {
  getPatches: (variables: TVariables) => OptimisticPatch[],
}

export type MutateOptimisticOptions<TData, TVariables> = {
  document: DocumentNode,
  variables: TVariables & { clientMutationId?: ClientMutationId },
  optimisticPlan: OptimisticPlan<TVariables>,
  optimisticPlanKey: string,
  entityType?: 'Task' | 'Patient',
  onSuccess?: (data: TData, variables: TVariables) => void,
  onError?: (error: Error, variables: TVariables) => void,
  onConflict?: (error: Error, variables: TVariables) => Promise<'retry' | 'use-server' | 'keep-local'>,
}

export type PendingMutationRecord = {
  clientMutationId: ClientMutationId,
  document: string,
  variables: unknown,
  optimisticPlanKey: string,
  createdAt: number,
}
