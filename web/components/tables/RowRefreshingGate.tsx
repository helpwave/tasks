import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type RowRefreshingGateProps = HTMLAttributes<HTMLDivElement> & {
  refreshing: boolean,
  children: ReactNode,
}

const RowRefreshingGateContext = createContext(false)

export function RowRefreshingGate({ refreshing, children, className, ...restProps }: RowRefreshingGateProps) {
  const parentRefreshing = useContext(RowRefreshingGateContext)
  const showOverlay = refreshing && !parentRefreshing

  return (
    <RowRefreshingGateContext.Provider value={parentRefreshing || refreshing}>
      <div className={clsx('relative min-h-8 min-w-0', className)} {...restProps}>
        <div className={showOverlay ? 'opacity-50' : undefined}>
          {children}
        </div>
        {showOverlay && (
          <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-surface/25"
            aria-busy
            aria-hidden
          >
            <Loader2 className="size-4 shrink-0 animate-spin text-description" />
          </div>
        )}
      </div>
    </RowRefreshingGateContext.Provider>
  )
}
