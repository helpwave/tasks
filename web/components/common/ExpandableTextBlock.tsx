import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type ExpandableTextBlockProps = {
  children: ReactNode,
  collapsedLines?: number,
  className?: string,
}

export const ExpandableTextBlock = ({ children, collapsedLines = 4, className }: ExpandableTextBlockProps) => {
  const translation = useTasksTranslation()
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const element = contentRef.current
    if (!element || expanded) {
      return
    }

    const updateOverflow = () => {
      setHasOverflow(element.scrollHeight > element.clientHeight + 1)
    }

    updateOverflow()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateOverflow)
      observer.observe(element)
      return () => {
        observer.disconnect()
      }
    }

    window.addEventListener('resize', updateOverflow)
    return () => {
      window.removeEventListener('resize', updateOverflow)
    }
  }, [expanded, children, collapsedLines])

  const collapsedStyle: CSSProperties | undefined = expanded
    ? undefined
    : {
      display: '-webkit-box',
      WebkitLineClamp: collapsedLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }

  return (
    <div className="min-w-0">
      <div
        ref={contentRef}
        className={clsx('min-w-0 break-words whitespace-pre-wrap', className)}
        style={collapsedStyle}
      >
        {children}
      </div>
      {(hasOverflow || expanded) && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setExpanded(prev => !prev)
          }}
          className="mt-1 text-sm font-medium text-primary hover:underline"
        >
          {expanded ? translation('hide') : translation('more')}
        </button>
      )}
    </div>
  )
}
