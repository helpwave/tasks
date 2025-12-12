import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ContentPanelProps = HTMLAttributes<HTMLDivElement> & {
  titleElement?: ReactNode,
  description?: ReactNode,
}

/**
 * The base for every content section of the page
 */
export const ContentPanel = ({
                               children,
                               titleElement,
                               description,
                               ...props
                             }: ContentPanelProps) => {
  return (
    <div {...props} className={clsx('flex-col-2 w-full h-full pt-6', props.className)}>
      <div className="flex-col-0">
        <h1 className="typography-title-lg">{titleElement}</h1>
        <div className="typography-label-md text-description">
          {description ?? <span className="invisible">placeholder</span>}
        </div>
      </div>
      {children}
    </div>
  )
}
