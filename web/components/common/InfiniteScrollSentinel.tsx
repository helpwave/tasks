import { useCallback, useEffect, useRef, useState } from 'react'
import { findScrollableAncestor } from '@/utils/scrollableAncestor'

type InfiniteScrollSentinelProps = {
  onLoadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
  /** Distance from the scroll container edge at which loading kicks in. Defaults to 800px. */
  rootMargin?: string,
  className?: string,
}

/**
 * Invisible marker that triggers `onLoadMore` as it approaches the bottom of the
 * scroll container. The observer is rooted at the nearest scrollable ancestor
 * (falling back to the viewport) so the generous root margin actually loads the
 * next window *before* the user reaches the bottom — when the target is rooted at
 * the viewport instead, an intervening `overflow-y-auto` container clips the
 * sentinel and the margin is ignored. Intersection state is tracked so loading
 * continues even when the marker stays in view after a page resolves (e.g. when
 * a page is shorter than the viewport).
 */
export function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isFetchingMore,
  rootMargin = '800px',
  className,
}: InfiniteScrollSentinelProps) {
  // A callback ref (state) re-runs the observer effect whenever the sentinel
  // mounts or unmounts. `hasMore` toggling false→true remounts the node with a
  // fresh element, and this keeps the observer attached to the live node instead
  // of a detached one.
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setIsIntersecting(entry.isIntersecting)
      },
      { root: findScrollableAncestor(node), rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, rootMargin])

  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    if (isIntersecting && hasMore && !isFetchingMore) {
      onLoadMoreRef.current()
    }
  }, [isIntersecting, hasMore, isFetchingMore])

  const setRef = useCallback((el: HTMLDivElement | null) => setNode(el), [])

  if (!hasMore) return null

  return <div ref={setRef} aria-hidden className={className} />
}
