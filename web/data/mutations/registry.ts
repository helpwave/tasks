import type { OptimisticPlan } from './types'

const registry = new Map<string, OptimisticPlan<unknown>>()

export function registerOptimisticPlan(key: string, plan: OptimisticPlan<unknown>): void {
  registry.set(key, plan)
}

export function getOptimisticPlan(key: string): OptimisticPlan<unknown> | undefined {
  return registry.get(key)
}
