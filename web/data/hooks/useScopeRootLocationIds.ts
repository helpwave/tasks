import { useMemo } from 'react'
import { useTasksContext } from '@/hooks/useTasksContext'

export function useScopeRootLocationIds(): string[] | undefined {
  const { selectedRootLocationIds } = useTasksContext()
  const key = (selectedRootLocationIds ?? []).slice().sort().join(',')
  return useMemo(
    () => (key.length > 0 ? key.split(',') : undefined),
    [key]
  )
}
