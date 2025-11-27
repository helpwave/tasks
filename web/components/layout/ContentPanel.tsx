import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

type ContentPanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: string,
  description?: string,
}

/**
 * The base for every content section of the page
 */
export const ContentPanel = ({
                               children,
                               title,
                               description,
                               ...props
                             }: ContentPanelProps) => {
  return (
    <div {...props} className={clsx('flex-col-2 w-full h-full pt-6', props.className)}>
      <div className="flex-col-0">
        <h1 className="typography-title-lg">{title}</h1>
        <p className="typography-label-md text-description">
          {description ?? <span className="invisible">placeholder</span>}
        </p>
      </div>
      {children}
    </div>
  )
}
