import type { HTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type RowRefreshingGateProps = HTMLAttributes<HTMLDivElement> & {
  refreshing: boolean,
  children: ReactNode,
}

/**
 * Keeps the cell content visible while an entity is being refreshed, dimming it
 * and overlaying a spinner instead of replacing it with a loading placeholder.
 */
export function RowRefreshingGate({ refreshing, children, className, ...restProps }: RowRefreshingGateProps) {
  return (
    <div className={clsx('relative min-h-8 min-w-0', className)} {...restProps}>
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
