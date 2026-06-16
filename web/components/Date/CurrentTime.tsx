import { DateUtils, Tooltip, useLocale } from '@helpwave/hightide'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

type CurrentTimeProps = {
  className?: string,
}

export const CurrentTime = ({ className }: CurrentTimeProps) => {
  const { locale, timeZone, is24HourFormat } = useLocale()
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(new Date())
    }, 500)

    return () => clearInterval(intervalId)
  }, [])

  const fullDate = useMemo(
    () => DateUtils.formatAbsolute(date, locale, 'dateTime', { timeZone, is24HourFormat }),
    [date, locale, timeZone, is24HourFormat]
  )

  const time = useMemo(
    () => DateUtils.formatAbsolute(date, locale, 'time', { timeZone, is24HourFormat }),
    [date, locale, timeZone, is24HourFormat]
  )

  return (
    <Tooltip tooltip={fullDate} alignment="top">
      <span className={clsx('tabular-nums cursor-default', className)}>
        {time}
      </span>
    </Tooltip>
  )
}
