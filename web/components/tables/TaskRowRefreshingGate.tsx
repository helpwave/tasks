import type { HTMLAttributes } from 'react'
import { createContext, useContext, type ReactNode } from 'react'
import { RowRefreshingGate } from './RowRefreshingGate'

const EMPTY_TASK_IDS = new Set<string>()

export const RefreshingTaskIdsContext = createContext<ReadonlySet<string>>(EMPTY_TASK_IDS)

type TaskRowRefreshingGateProps = HTMLAttributes<HTMLDivElement> & {
  taskId: string,
  children: ReactNode,
}

export function TaskRowRefreshingGate({ taskId, children, ...restProps }: TaskRowRefreshingGateProps) {
  const ids = useContext(RefreshingTaskIdsContext)
  return (
    <RowRefreshingGate refreshing={ids.has(taskId)} {...restProps}>
      {children}
    </RowRefreshingGate>
  )
}
