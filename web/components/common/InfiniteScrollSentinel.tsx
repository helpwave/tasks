import { useCallback, useEffect, useRef, useState } from 'react'
import { findScrollableAncestor } from '@/utils/scrollableAncestor'

type InfiniteScrollSentinelProps = {
  onLoadMore: () => void,
  hasMore: boolean,
  isFetchingMore: boolean,
  rootMargin?: string,
  className?: string,
}

export function InfiniteScrollSentinel({
  onLoadMore,
  hasMore,
  isFetchingMore,
  rootMargin = '800px',
  className,
}: InfiniteScrollSentinelProps) {
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
