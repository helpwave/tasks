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
    <div {...props} className={clsx('flex-col-2 w-full h-full pt-6', props.className)}>
      <div className="flex-col-0">
        <div className="flex-row-2 justify-between items-center w-full">
          <h1 className="typography-title-lg">{titleElement}</h1>
          {actionElement && (
            <div>
              {actionElement}
            </div>
          )}
        </div>
        <div className="typography-label-md text-description">
          {description ?? <span className="invisible">placeholder</span>}
        </div>
      </div>
      {children}
    </div>
  )
}
