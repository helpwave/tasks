import { useEffect, useRef, useState } from 'react'

type InfiniteScrollSentinelProps = {
  onLoadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
  /** Distance from the viewport at which loading kicks in. Defaults to 800px. */
  rootMargin?: string,
  className?: string,
}

/**
 * Invisible marker that triggers `onLoadMore` as it approaches the viewport.
 * The generous root margin loads the next window before the user reaches the
 * bottom, which keeps scrolling smooth on touch devices. Intersection state is
 * tracked so loading continues even when the marker stays in view after a page
 * resolves.
 */
export function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isFetchingMore,
  rootMargin = '800px',
  className,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setIsIntersecting(entry.isIntersecting)
      },
      { rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    if (isIntersecting && hasMore && !isFetchingMore) {
      onLoadMoreRef.current()
    }
  }, [isIntersecting, hasMore, isFetchingMore])

  if (!hasMore) return null

  return <div ref={ref} aria-hidden className={className} />
}
