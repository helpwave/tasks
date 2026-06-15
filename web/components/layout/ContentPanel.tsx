import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ContentPanelProps = HTMLAttributes<HTMLDivElement> & {
  titleElement?: ReactNode,
  description?: ReactNode,
  actionElement?: ReactNode,
}

export const ContentPanel = ({
  children,
  titleElement,
  description,
  actionElement,
  ...props
}: ContentPanelProps) => {
  return (
    <div {...props} className={clsx('flex-col-2 w-full', props.className)}>
      <div className="flex-col-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col gap-1">
            <h1 className="typography-title-lg">{titleElement}</h1>
            <span className="typography-label-md text-description">
              {description ?? <span className="invisible">placeholder</span>}
            </span>
          </div>
          {actionElement && (
            <div className="flex-shrink-0">
              {actionElement}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
