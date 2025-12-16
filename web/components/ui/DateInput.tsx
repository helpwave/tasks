import type { HTMLAttributes } from 'react'
import { useMemo } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { InputProps } from '@helpwave/hightide'
import { Button, DatePicker, Input, useLocale, useOutsideClick, useZIndexRegister } from '@helpwave/hightide'
import { CalendarIcon } from 'lucide-react'
import { formatAbsolute } from '@/utils/date'
import clsx from 'clsx'

export type DateInputProps = InputProps & {
  date: Date,
  onValueChange: (date: Date) => void,
  containerProps?: HTMLAttributes<HTMLDivElement>,
}

export const DateInput = ({ date, onValueChange, containerProps, ...props }: DateInputProps) => {
  const { locale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useOutsideClick([containerRef], () => setIsOpen(false))

  const zIndex = useZIndexRegister(isOpen)

  const isReadOnly = useMemo(() => props.readOnly || props.disabled, [props.readOnly, props.disabled])

  useEffect(() => {
    if(isReadOnly) {
      setIsOpen(false)
    }
  }, [isReadOnly])

  return (
    <>
      <div {...containerProps} className={clsx('relative w-full', containerProps?.className)}>
        <Input
          {...props}
          value={formatAbsolute(date, locale, false)}
          onClick={(event) => {
            setIsOpen(true)
            props.onClick?.(event)
          }}
          readOnly={true}
          className={clsx(
            'pr-10 w-full',
            { 'hover:cursor-pointer': !isReadOnly },
            props.className
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
          <DatePicker
            value={date}
            onChange={(newDate) => {
              onValueChange(newDate)
              setIsOpen(false)
            }}
            className="max-h-75.5 min-w-80"
          />
        </div>
      )}
    </>
  )
}
