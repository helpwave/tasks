import { type PropsWithChildren } from 'react'
import { useGlobalSubscriptions } from '@/hooks/useGlobalSubscriptions'
import { useTasksContext } from '@/hooks/useTasksContext'

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { selectedRootLocationIds } = useTasksContext()
  useGlobalSubscriptions(selectedRootLocationIds)

  return <>{children}</>
}

