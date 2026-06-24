'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

  // Column count and scroll-margin depend on the container geometry/position, not on how many items
  // are loaded. Keeping `items.length` out of the dependency list avoids tearing down and recreating
  // the observer (and a forced synchronous layout read) on every infinite-scroll page append — the
  // ResizeObserver already fires when the grid grows, so margin/columns stay correct.
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
  }, [minCardWidthPx, gapPx])

  // Chunk once per items/columns change rather than on every render. The virtualizer re-renders this
  // component on every scroll frame; without memoization the whole list was re-chunked into a fresh
  // nested array each frame, which was the dominant source of allocation/GC pressure (the "memory
  // keeps climbing while scrolling fast" symptom) on large lists.
  const rows = useMemo(() => chunkIntoRows(items, columns), [items, columns])

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

  // When the column count changes the rows are recomposed (a different set of cards per row), so the
  // measured per-row heights cached by the virtualizer no longer apply. Reset them so each row
  // re-measures under the new layout instead of reusing a stale height (which showed up as rows
  // overlapping or jumping right after a viewport resize).
  useEffect(() => {
    virtualizer.measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

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
