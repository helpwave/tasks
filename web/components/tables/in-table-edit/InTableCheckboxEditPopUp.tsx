import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, Checkbox, PopUp, PopUpContext, PopUpOpener, PopUpRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

type InTableCheckboxEditPopUpProps = {
  value: boolean | null,
  onUpdate: (next: boolean | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableCheckboxEditPopUp({
  value,
  onUpdate,
  buttonProps,
  children,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableCheckboxEditPopUpProps) {
  const baseline = value ?? false
  const [draft, setDraft] = useState<boolean>(baseline)
  const translation = useTasksTranslation()

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value ?? false)
        } else if (draft !== baseline) {
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
      <PopUp options={options} aria-label={translation('edit')} className={clsx(className, 'flex-col-2 items-end')} onClick={e => e.stopPropagation()}>
        <div className="felx-row-0 w-full items-start">
          <Checkbox
            value={draft}
            onValueChange={setDraft}
          />
        </div>
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
