import type { ApolloCache, NormalizedCacheObject } from '@apollo/client/cache'
import {
  getCacheSnapshot,
  getPendingMutations as getPersistedPendingMutations,
  setCacheSnapshot
} from '../storage/indexed-db'
import { addPendingMutation } from '../mutations/queue'
import { getOptimisticPlan } from '../mutations/registry'
import '@/data/mutations/plans'

const PERSIST_DEBOUNCE_MS = 500
let persistTimeout: ReturnType<typeof setTimeout> | null = null

export async function rehydrateCache(cache: ApolloCache): Promise<void> {
  if (typeof window === 'undefined') return
  const snapshot = await getCacheSnapshot()
  if (snapshot && Object.keys(snapshot).length > 0) {
    cache.restore(snapshot)
  }
}

export async function replayPendingMutations(cache: ApolloCache): Promise<void> {
  if (typeof window === 'undefined') return
  const pending = await getPersistedPendingMutations()
  for (const record of pending) {
    const plan = getOptimisticPlan(record.optimisticPlanKey)
    if (!plan) continue
    const patches = plan.getPatches(record.variables)
    for (const patch of patches) {
      try {
        patch.apply(cache, record.variables)
      } catch {
        //
      }
    }
    addPendingMutation(record)
  }
}

export function schedulePersistCache(cache: ApolloCache): void {
  if (typeof window === 'undefined') return
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    persistTimeout = null
    const snapshot = cache.extract() as NormalizedCacheObject
    setCacheSnapshot(snapshot).catch(() => {})
  }, PERSIST_DEBOUNCE_MS)
}

export async function persistCacheNow(cache: ApolloCache): Promise<void> {
  if (typeof window === 'undefined') return
  if (persistTimeout) {
    clearTimeout(persistTimeout)
    persistTimeout = null
  }
  const snapshot = cache.extract() as NormalizedCacheObject
  await setCacheSnapshot(snapshot)
}
