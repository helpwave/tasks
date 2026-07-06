'use client'

import { useEffect, useRef, useState } from 'react'
import { IconButton } from '@helpwave/hightide'
import { ArrowUp } from 'lucide-react'
import clsx from 'clsx'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

const SHOW_THRESHOLD_PX = 400
const APP_PAGE_CONTENT_SELECTOR = '[data-name="app-page-content"]'

/**
 * A floating action button that returns the user to the top of the surrounding
 * AppPage scroll container. Meant for the long, page-scrolling list views where
 * the table/cards can grow well beyond a screenful.
 */
export const ScrollToTopButton = () => {
  const translation = useTasksTranslation()
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = anchorRef.current?.closest(APP_PAGE_CONTENT_SELECTOR)
    setScrollElement(element instanceof HTMLElement ? element : null)
  }, [])

  useEffect(() => {
    if (!scrollElement) return
    let frame: number | null = null
    const update = () => {
      frame = null
      setIsVisible(scrollElement.scrollTop > SHOW_THRESHOLD_PX)
    }
    const handleScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [scrollElement])

  return (
    <span ref={anchorRef} className="contents">
      <IconButton
        tooltip={translation('scrollToTop')}
        onClick={() => scrollElement?.scrollTo({ top: 0, behavior: 'smooth' })}
        color="primary"
        className={clsx(
          'fixed bottom-6 right-6 z-30 shadow-around-md transition-opacity duration-200 print:hidden',
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <ArrowUp className="size-5" />
      </IconButton>
    </span>
  )
}
