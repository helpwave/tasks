import { createContext, useContext, type ReactNode } from 'react'
import { LoadingContainer } from '@helpwave/hightide'

const EMPTY_TASK_IDS = new Set<string>()

export const RefreshingTaskIdsContext = createContext<ReadonlySet<string>>(EMPTY_TASK_IDS)

type TaskRowRefreshingGateProps = {
  taskId: string,
  children: ReactNode,
}

export function TaskRowRefreshingGate({ taskId, children }: TaskRowRefreshingGateProps) {
  const ids = useContext(RefreshingTaskIdsContext)
  if (ids.has(taskId)) {
    return <LoadingContainer className="w-full min-h-8" />
  }
  return children
}
