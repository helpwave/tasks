'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { chunkIntoRows, columnsForWidth } from '@/utils/virtualGrid'

const DEFAULT_GAP_PX = 12
const DEFAULT_ESTIMATE_ROW_HEIGHT_PX = 220
const DEFAULT_OVERSCAN_ROWS = 4
const DEFAULT_VIRTUALIZE_THRESHOLD = 40

type VirtualizedCardGridProps<T> = {
  items: readonly T[],
  getItemKey: (item: T) => string,
  renderItem: (item: T) => ReactNode,
  minCardWidthPx: number,
  gapPx?: number,
  estimateRowHeightPx?: number,
  overscanRows?: number,
  virtualizeThreshold?: number,
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
}: VirtualizedCardGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [columns, setColumns] = useState(1)
  const [scrollMargin, setScrollMargin] = useState(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element || typeof window === 'undefined') return

    const measure = () => {
      const nextColumns = columnsForWidth(element.clientWidth, minCardWidthPx, gapPx)
      setColumns((prev) => (prev === nextColumns ? prev : nextColumns))
      const nextScrollMargin = element.getBoundingClientRect().top + window.scrollY
      setScrollMargin((prev) => (Math.abs(prev - nextScrollMargin) < 1 ? prev : nextScrollMargin))
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [minCardWidthPx, gapPx, items.length])

  const rows = chunkIntoRows(items, columns)
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => estimateRowHeightPx,
    overscan: overscanRows,
    scrollMargin,
    getItemKey: (index) => {
      const first = rows[index]?.[0]
      return first ? getItemKey(first) : index
    },
  })

  const autoFillTemplate = `repeat(auto-fill, minmax(min(100%, ${minCardWidthPx}px), 1fr))`
  const shouldVirtualize = isMounted && items.length > virtualizeThreshold

  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} className="w-full print:hidden">
        <div className="grid gap-3 w-full" style={{ gridTemplateColumns: autoFillTemplate }}>
          {items.map(renderItem)}
        </div>
      </div>
    )
  }

  const explicitTemplate = `repeat(${columns}, minmax(0, 1fr))`

  return (
    <div ref={containerRef} className="w-full print:hidden">
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
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
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
