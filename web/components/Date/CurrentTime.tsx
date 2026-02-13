import { Tooltip, useLocale } from '@helpwave/hightide'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

type CurrentTimeProps = {
    className?: string,
}

export const CurrentTime = ({ className }: CurrentTimeProps) => {
  const { locale } = useLocale()
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(new Date())
    }, 500)

    return () => clearInterval(intervalId)
  })

  const dateFormatFull = Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const fullDate = dateFormatFull.format(date)

  const timeFormat = Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const time = timeFormat.format(date)

  return (
    <Tooltip tooltip={fullDate} alignment="top">
      <span className={clsx('tabular-nums cursor-default', className)}>
        {time}
      </span>
    </Tooltip>
  )
}