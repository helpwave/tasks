'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { useVirtualizer } from '@tanstack/react-virtual'
import { chunkIntoRows, columnsForWidth } from '@/utils/virtualGrid'
import { isNearBottom } from '@/utils/nearBottom'

const DEFAULT_GAP_PX = 12
const DEFAULT_ESTIMATE_ROW_HEIGHT_PX = 220
const DEFAULT_OVERSCAN_ROWS = 4
const DEFAULT_VIRTUALIZE_THRESHOLD = 40
const REACH_BOTTOM_THRESHOLD_PX = 600

type VirtualizedCardGridProps<T> = {
  items: readonly T[],
  getItemKey: (item: T) => string,
  renderItem: (item: T) => ReactNode,
  minCardWidthPx: number,
  gapPx?: number,
  estimateRowHeightPx?: number,
  overscanRows?: number,
  virtualizeThreshold?: number,
  containerClassName?: string,
  onReachBottom?: () => void,
}

export function VirtualizedCardGrid<T>({
  items,
  getItemKey,
  renderItem,
  minCardWidthPx,
  gapPx = DEFAULT_GAP_PX,
  estimateRowHeightPx = DEFAULT_ESTIMATE_ROW_HEIGHT_PX,
  overscanRows = DEFAULT_OVERSCAN_ROWS,
  virtualizeThreshold = DEFAULT_VIRTUALIZE_THRESHOLD,
  containerClassName,
  onReachBottom,
}: VirtualizedCardGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof window === 'undefined') return

    const measure = () => {
      const nextColumns = columnsForWidth(element.clientWidth, minCardWidthPx, gapPx)
      setColumns((prev) => (prev === nextColumns ? prev : nextColumns))
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [minCardWidthPx, gapPx])

  const rows = useMemo(() => chunkIntoRows(items, columns), [items, columns])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeightPx,
    overscan: overscanRows,
    getItemKey: (index) => {
      const first = rows[index]?.[0]
      return first ? getItemKey(first) : index
    },
  })

  useEffect(() => {
    virtualizer.measure()
  }, [columns, virtualizer])

  const handleScroll = () => {
    const element = containerRef.current
    if (element && onReachBottom && isNearBottom(element, REACH_BOTTOM_THRESHOLD_PX)) {
      onReachBottom()
    }
  }

  const autoFillTemplate = `repeat(auto-fill, minmax(min(100%, ${minCardWidthPx}px), 1fr))`
  const shouldVirtualize = isMounted && items.length > virtualizeThreshold

  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} onScroll={handleScroll} className={clsx('w-full print:hidden', containerClassName)}>
        <div className="grid gap-3 w-full" style={{ gridTemplateColumns: autoFillTemplate }}>
          {items.map(renderItem)}
        </div>
      </div>
    )
  }

  const explicitTemplate = `repeat(${columns}, minmax(0, 1fr))`

  return (
    <div ref={containerRef} onScroll={handleScroll} className={clsx('w-full print:hidden', containerClassName)}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index] ?? []
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid gap-3 pb-3 w-full" style={{ gridTemplateColumns: explicitTemplate }}>
                {row.map(renderItem)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
