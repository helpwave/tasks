import type { ReactNode } from 'react'
import { useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, DateTimeInput, PopUp, PopUpContext, PopUpOpener, PopUpRoot } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

function sameMoment(a: Date | null, b: Date | null): boolean {
  if (a == null && b == null) {
    return true
  }
  if (a == null || b == null) {
    return false
  }
  return a.getTime() === b.getTime()
}

type InTableDateTimeEditPopUpProps = {
  value: Date | null,
  onUpdate: (next: Date | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
  dateTimeInputProps?: Omit<
    ComponentProps<typeof DateTimeInput>,
    'value' | 'onValueChange' | 'onEditComplete'
  >,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableDateTimeEditPopUp({
  value,
  onUpdate,
  buttonProps,
  children,
  dateTimeInputProps,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableDateTimeEditPopUpProps) {
  const [draft, setDraft] = useState<Date | null>(value)
  const translation = useTasksTranslation()

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value)
        } else if (!sameMoment(draft, value)) {
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
        <DateTimeInput
          mode="dateTime"
          {...dateTimeInputProps}
          value={draft}
          onValueChange={next => {
            setDraft(next)
          }}
          onEditComplete={v => {
            setDraft(v)
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
                onUpdate(draft)
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
