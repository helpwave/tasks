import { useMemo } from 'react'
import { useLocale } from '@helpwave/hightide'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { DueDateUtils } from '@/utils/dueDate'

type DueDateDisplayProps = {
  value: Date | string | null | undefined,
  className?: string,
  mode?: 'relative' | 'absolute',
}

export const DueDateDisplay = ({ value, className, mode = 'absolute' }: DueDateDisplayProps) => {
  const { timeZone } = useLocale()
  const resolved = useMemo(
    () => (timeZone ? DueDateUtils.resolveForDisplay(value, timeZone) : undefined),
    [value, timeZone]
  )

  if (!resolved) return null

  return (
    <DateDisplay
      date={resolved.instant}
      className={className}
      mode={mode}
      showTime={!resolved.isDateOnly}
    />
  )
}
