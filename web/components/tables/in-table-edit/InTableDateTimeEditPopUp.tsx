import type { ReactNode } from 'react'
import { useEffect, useState, type ComponentProps } from 'react'
import type { ButtonProps } from '@helpwave/hightide'
import { Button, DateTimeInput, FlexibleDateTimeInput, PopUp, PopUpContext, PopUpOpener, PopUpRoot, useLocale } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { getTaskDueDateFlexibleInputProps, TASK_DUE_DATE_DATE_TIME_INPUT_PROPS } from '@/utils/dueDate'
import { samePropertyDateInputValue } from '@/utils/calendarDate'
import clsx from 'clsx'

type InTableDateTimeEditPopUpProps = {
  value: Date | null,
  onUpdate: (next: Date | null) => void,
  buttonProps?: ButtonProps,
  children: ReactNode,
  mode?: 'date' | 'dateTime',
  /**
   * When true, lets the user choose between a date-only and a date+time value via the
   * input's built in toggle. A date-only selection is stored at the end of the day so it
   * carries no meaningful time. `mode` is used as the initial mode.
   */
  flexible?: boolean,
  dateTimeInputProps?: Omit<
    ComponentProps<typeof DateTimeInput>,
    'value' | 'onValueChange' | 'onEditComplete' | 'mode'
  >,
} & Partial<Pick<ComponentProps<typeof PopUp>, 'options' | 'className'>>

export function InTableDateTimeEditPopUp({
  value,
  onUpdate,
  buttonProps,
  children,
  mode = 'dateTime',
  flexible = false,
  dateTimeInputProps,
  options = { horizontalAlignment: 'afterStart', verticalAlignment: 'afterEnd' },
  className = 'p-2',
}: InTableDateTimeEditPopUpProps) {
  const { timeZone } = useLocale()
  const [draft, setDraft] = useState<Date | null>(value)
  const translation = useTasksTranslation()

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commitDraft = (next: Date | null) => {
    setDraft(next)
    if (!samePropertyDateInputValue(next, value, mode, timeZone)) {
      onUpdate(next)
    }
  }

  return (
    <PopUpRoot
      onIsOpenChange={open => {
        if (open) {
          setDraft(value)
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
        {flexible ? (
          <FlexibleDateTimeInput
            {...getTaskDueDateFlexibleInputProps(mode === 'dateTime' ? 'dateTime' : 'date')}
            {...dateTimeInputProps}
            value={draft}
            onValueChange={commitDraft}
            onEditComplete={commitDraft}
          />
        ) : (
          <DateTimeInput
            mode={mode}
            {...TASK_DUE_DATE_DATE_TIME_INPUT_PROPS}
            {...dateTimeInputProps}
            value={draft}
            onValueChange={commitDraft}
            onEditComplete={commitDraft}
          />
        )}
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
