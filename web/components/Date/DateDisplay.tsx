import { Tooltip, useLocale } from '@helpwave/hightide'
import clsx from 'clsx'
import { useMemo } from 'react'
import {
  formatAbsoluteHightide,
  formatRelativeHightide,
  type DateTimeFormat
} from '@/utils/hightideDateFormat'

type DateDisplayProps = {
  date: Date,
  className?: string,
  showTime?: boolean,
  mode?: 'relative' | 'absolute',
}

function toAbsoluteFormat(showTime: boolean): DateTimeFormat {
  return showTime ? 'dateTime' : 'date'
}

export const DateDisplay = ({ date, className, showTime = true, mode = 'relative' }: DateDisplayProps) => {
  const { locale } = useLocale()
  const absoluteFormat = toAbsoluteFormat(showTime)
  const absolute = useMemo(
    () => (date ? formatAbsoluteHightide(date, locale, absoluteFormat) : ''),
    [date, locale, absoluteFormat]
  )
  const relative = useMemo(
    () => (date ? formatRelativeHightide(date, locale) : ''),
    [date, locale]
  )

  if (!date) return null

  const displayString = mode === 'relative' ? relative : absolute
  const tooltipString = mode === 'relative' ? absolute : relative

  return (
    <Tooltip tooltip={tooltipString} alignment="top" containerClassName="w-fit">
      <span className={clsx('cursor-help underline decoration-dotted decoration-neutral-300 underline-offset-2', className)}>
        {displayString}
      </span>
    </Tooltip>
  )
}
