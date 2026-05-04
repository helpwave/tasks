import { createContext, useContext, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const EMPTY_TASK_IDS = new Set<string>()

export const RefreshingTaskIdsContext = createContext<ReadonlySet<string>>(EMPTY_TASK_IDS)

type TaskRowRefreshingGateProps = {
  taskId: string,
  children: ReactNode,
  className?: string,
}

export function TaskRowRefreshingGate({ taskId, children, className }: TaskRowRefreshingGateProps) {
  const ids = useContext(RefreshingTaskIdsContext)
  const refreshing = ids.has(taskId)
  return (
    <div className={clsx('relative min-h-8 min-w-0', className)}>
      <div className={refreshing ? 'opacity-50' : undefined}>
        {children}
      </div>
      {refreshing && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-surface/25"
          aria-busy
          aria-hidden
        >
          <Loader2 className="size-4 shrink-0 animate-spin text-description" />
        </div>
      )}
    </div>
  )
}
