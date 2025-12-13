import { useState, useRef } from 'react'
import { DatePicker, Input, useOutsideClick } from '@helpwave/hightide'
import { CalendarIcon } from 'lucide-react'

interface PopupDatePickerProps {
  date: Date
  onDateChange: (date: Date) => void
  label?: string
}

export const PopupDatePicker = ({ date, onDateChange, label }: PopupDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOutsideClick([containerRef], () => setIsOpen(false))

  return (
    <div className="flex flex-col gap-1 w-full" ref={containerRef}>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
      <div className="relative">
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          <Input
            value={date ? date.toLocaleDateString() : ''}
            readOnly
            className="cursor-pointer pr-10"
          />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-description pointer-events-none">
          <CalendarIcon className="size-5" />
        </div>
        {isOpen && (
          <div className="absolute z-50 mt-1 left-0 bg-surface rounded-lg shadow-xl border border-divider p-2 bg-white min-w-[300px]">
            <DatePicker
              value={date}
              onChange={(newDate) => {
                onDateChange(newDate)
                setIsOpen(false)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
