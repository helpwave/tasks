import { useEffect, useRef } from 'react'

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold?: number,
  maxVerticalDistance?: number,
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxVerticalDistance = 100,
}: UseSwipeGestureOptions) => {
  const elementRef = useRef<HTMLElement | null>(null)
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight })
  const thresholdRef = useRef(threshold)
  const maxVerticalDistanceRef = useRef(maxVerticalDistance)
  const touchStartRef = useRef<{ x: number, y: number, scrollY: number } | null>(null)
  const touchEndRef = useRef<{ x: number, y: number, scrollY: number } | null>(null)
  const isScrollingRef = useRef(false)

  useEffect(() => {
    callbacksRef.current = { onSwipeLeft, onSwipeRight }
    thresholdRef.current = threshold
    maxVerticalDistanceRef.current = maxVerticalDistance
  }, [onSwipeLeft, onSwipeRight, threshold, maxVerticalDistance])

  const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null

    const table = element.closest('table') || element.closest('[role="table"]')
    if (table) {
      let parent = table.parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflowX === 'auto' || style.overflowX === 'scroll') {
          return parent
        }
        parent = parent.parentElement
      }
      return table as HTMLElement
    }

    let current: HTMLElement | null = element
    while (current) {
      const style = window.getComputedStyle(current)
      if (style.overflow === 'auto' || style.overflow === 'scroll' ||
          style.overflowY === 'auto' || style.overflowY === 'scroll' ||
          style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return current
      }
      current = current.parentElement
    }

    return null
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return
      const target = e.target as HTMLElement
      const scrollableParent = findScrollableParent(target)

      touchEndRef.current = null
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollY: scrollableParent?.scrollTop || window.scrollY,
      }
      isScrollingRef.current = !!scrollableParent
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return
      const target = e.target as HTMLElement
      const scrollableParent = findScrollableParent(target)
      const currentScrollY = scrollableParent?.scrollTop || window.scrollY

      touchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollY: currentScrollY,
      }

      if (touchStartRef.current && Math.abs(currentScrollY - touchStartRef.current.scrollY) > 5) {
        isScrollingRef.current = true
      }
    }

    const onTouchEnd = () => {
      const start = touchStartRef.current
      const end = touchEndRef.current

      if (!start || !end) {
        touchStartRef.current = null
        touchEndRef.current = null
        isScrollingRef.current = false
        return
      }

      if (isScrollingRef.current || Math.abs(start.scrollY - end.scrollY) > 5) {
        touchStartRef.current = null
        touchEndRef.current = null
        isScrollingRef.current = false
        return
      }

      const distanceX = start.x - end.x
      const distanceY = Math.abs(start.y - end.y)
      const isLeftSwipe = distanceX > thresholdRef.current
      const isRightSwipe = distanceX < -thresholdRef.current
      const isHorizontalSwipe = distanceY < maxVerticalDistanceRef.current

      if (isHorizontalSwipe) {
        if (isLeftSwipe && callbacksRef.current.onSwipeLeft) {
          callbacksRef.current.onSwipeLeft()
        }
        if (isRightSwipe && callbacksRef.current.onSwipeRight) {
          callbacksRef.current.onSwipeRight()
        }
      }

      touchStartRef.current = null
      touchEndRef.current = null
      isScrollingRef.current = false
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return elementRef
}
