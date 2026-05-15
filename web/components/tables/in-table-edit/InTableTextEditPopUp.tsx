import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, Input, PopUp, PopUpContext, PopUpOpener, PopUpRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

type InTableTextEditPopUpProps = {
  value: string | null,
  onUpdate: (next: string | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableTextEditPopUp({
  value,
  onUpdate,
  buttonProps,
  children,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableTextEditPopUpProps) {
  const [draft, setDraft] = useState(value)
  const translation = useTasksTranslation()

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value)
        } else if (draft !== value) {
          onUpdate(draft)
        }
      }}
    >
      <PopUpOpener<HTMLButtonElement>>
        {({ props }) => {
          const { ref: openerRef, ...openerButtonProps } = props
          return (
            <Button
              color="neutral"
              size="sm"
              coloringStyle="text"
              {...buttonProps}
              {...openerButtonProps}
              ref={openerRef}
            >
              {children}
            </Button>
          )
        }}
      </PopUpOpener>
      <PopUp options={options} className={clsx(className, 'flex-col-2 items-end')} onClick={e => e.stopPropagation()}>
        <Input
          value={draft ?? ''}
          onValueChange={next => {
            setDraft(next)
          }}
        />
        <PopUpContext.Consumer>
          {({ setIsOpen }) => (
            <div className="flex-row-2 justify-end items-center gap-x-2">
              <Button color="neutral" size="sm" onClick={() => {
                setIsOpen(false)
              }}>
                {translation('cancel')}
              </Button>
              <Button color="primary" size="sm" onClick={() => {
                setIsOpen(false)
              }}>
                {translation('done')}
              </Button>
            </div>
          )}
        </PopUpContext.Consumer>
      </PopUp>
    </PopUpRoot>
  )
}
