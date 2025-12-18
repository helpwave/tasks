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
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const touchEndRef = useRef<{ x: number, y: number } | null>(null)

  useEffect(() => {
    callbacksRef.current = { onSwipeLeft, onSwipeRight }
    thresholdRef.current = threshold
    maxVerticalDistanceRef.current = maxVerticalDistance
  }, [onSwipeLeft, onSwipeRight, threshold, maxVerticalDistance])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return
      touchEndRef.current = null
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return
      touchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }

    const onTouchEnd = () => {
      const start = touchStartRef.current
      const end = touchEndRef.current

      if (!start || !end) {
        touchStartRef.current = null
        touchEndRef.current = null
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
