import type { HTMLAttributes } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DateTimePickerProps, InputProps } from '@helpwave/hightide'
import {
  Button,
  DateTimePicker,
  Input,
  useLocale,
  useOutsideClick,
  useOverwritableState,
  useZIndexRegister
} from '@helpwave/hightide'
import { CalendarIcon } from 'lucide-react'
import { formatAbsolute } from '@/utils/date'
import clsx from 'clsx'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export type DateInputProps = InputProps & {
  date: Date | null,
  onValueChange: (date: Date) => void,
  onRemove: () => void,
  // TODO also allow only time selection here
  mode: 'date' | 'dateTime',
  containerProps?: HTMLAttributes<HTMLDivElement>,
  dateTimePickerProps?: Omit<DateTimePickerProps, 'mode' | 'value' | 'onChange'>,
}

export const DateInput = ({
                            date: initialDate,
                            onValueChange,
                            onRemove,
                            containerProps,
                            mode = 'date',
                            dateTimePickerProps,
                            ...props
                          }: DateInputProps) => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useOverwritableState<Date>(useMemo(() => initialDate ?? new Date(), [initialDate]))

  const containerRef = useRef<HTMLDivElement>(null)

  useOutsideClick([containerRef], () => {
    setIsOpen(false)
    setDate(initialDate ?? new Date())
  })

  const zIndex = useZIndexRegister(isOpen)

  const isReadOnly = useMemo(() => props.readOnly || props.disabled, [props.readOnly, props.disabled])

  useEffect(() => {
    if (isReadOnly) {
      setIsOpen(false)
    }
  }, [isReadOnly])

  const cleanInputProps = { ...props } as Omit<typeof props, 'isShowingError' | 'setIsShowingError'> & Record<string, unknown>
  delete (cleanInputProps as Record<string, unknown>)['isShowingError']
  delete (cleanInputProps as Record<string, unknown>)['setIsShowingError']

  return (
    <>
      <div {...containerProps} className={clsx('relative w-full', containerProps?.className)}>
        <Input
          {...cleanInputProps}
          placeholder={translation('clickToAdd')}
          value={initialDate ? formatAbsolute(initialDate, locale, mode === 'dateTime') : ''}
          onClick={(event) => {
            setIsOpen(true)
            cleanInputProps.onClick?.(event)
          }}
          readOnly={true}
          className={clsx(
            'pr-10 w-full',
            { 'hover:cursor-pointer': !isReadOnly },
            cleanInputProps.className
          )}
        />
        <Button
          coloringStyle="text" layout="icon" color="neutral" size="small"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          disabled={isReadOnly}
          onClick={() => setIsOpen(prevState => !prevState)}
        >
          <CalendarIcon className="size-5"/>
        </Button>
      </div>
      {isOpen && (
        <div
          ref={containerRef}
          className="absolute mt-1 left-0 rounded-lg shadow-xl border bg-surface text-on-surface border-divider p-2"
          style={{ zIndex }}
        >
          <DateTimePicker
            {...dateTimePickerProps}
            mode={mode}
            value={date}
            onChange={(newDate) => {
              setDate(newDate)
            }}
            onFinish={(newDate) => {
              setDate(newDate)
              onValueChange(newDate)
              setIsOpen(false)
            }}
            onRemove={() => {
              const newDate = new Date()
              setDate(newDate)
              onRemove()
              setIsOpen(false)
            }}
          />
        </div>
      )}
    </>
  )
}
