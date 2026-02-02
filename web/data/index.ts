export { createApolloClient } from './client'
export type { CreateApolloClientOptions } from './client'
export { buildCacheConfig } from './cache/policies'
export {
  persistCacheNow,
  replayPendingMutations,
  rehydrateCache,
  schedulePersistCache,
} from './cache/persist'
export { createAuthHttpLink } from './link/http'
export type { GetToken } from './link/http'
export { createWsLink } from './link/ws'
export { mutateOptimistic } from './mutations/runner'
export { addPendingMutation, getPendingMutations, removePendingMutation } from './mutations/queue'
export {
  addPendingMutation as persistPendingMutation,
  getPendingMutations as getPersistedPendingMutations,
  getCacheSnapshot,
  setCacheSnapshot,
} from './storage/indexed-db'
export {
  clearEntityMutated,
  markEntityMutated,
  mergePatientUpdatedIntoCache,
  mergeSubscriptionIntoCache,
  mergeTaskUpdatedIntoCache,
} from './subscriptions/handler'
export type {
  ConflictStrategy,
  MergeSubscriptionOptions,
  SubscriptionPayload,
} from './subscriptions/handler'
export { useApolloGlobalSubscriptions } from './subscriptions/useApolloGlobalSubscriptions'
export { useRefreshingEntityIds } from './subscriptions/useRefreshingEntityIds'
export { getOptimisticPlan, registerOptimisticPlan } from './mutations/registry'
export {
  useTask,
  useTasks,
  usePatient,
  usePatients,
  useLocations,
  useLocationNode,
  useGlobalData,
  useOverviewData,
  useUsers,
  usePropertyDefinitions,
  useUser,
  useAuditLogs,
  usePropertiesForSubject,
  useMyTasks,
  useTasksPaginated,
  usePatientsPaginated,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useReopenTask,
  useAssignTask,
  useUnassignTask,
  useAssignTaskToTeam,
  useUnassignTaskFromTeam,
  useCreatePatient,
  useUpdatePatient,
  useAdmitPatient,
  useDischargePatient,
  useDeletePatient,
  useWaitPatient,
  useMarkPatientDead,
  useCreatePropertyDefinition,
  useUpdatePropertyDefinition,
  useDeletePropertyDefinition,
  useUpdateProfilePicture,
} from './hooks'
export type {
  ClientMutationId,
  MutateOptimisticOptions,
  OptimisticPatch,
  OptimisticPlan,
  PendingMutationRecord,
} from './mutations/types'
