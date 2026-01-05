import { useEffect, useState } from 'react'
import { Tooltip, useRerender } from '@helpwave/hightide'
import { useLocale } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

type SmartDateProps = {
  date: Date,
  className?: string,
  showTime?: boolean,
  mode?: 'relative' | 'absolute',
}

const formatGerman = (date: Date, showTime: boolean) => {
  const d = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

  if (!showTime) return d

  const t = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return `${d} um ${t} Uhr`
}

export const formatAbsolute = (date: Date, locale: string, showTime: boolean) => {
  if (locale === 'de-DE') {
    return formatGerman(date, showTime)
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }

  if (showTime) {
    options.hour = 'numeric'
    options.minute = 'numeric'
  }

  return new Intl.DateTimeFormat(locale, options).format(date)
}

export const formatRelative = (date: Date, locale: string, showTime: boolean) => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = new Date()
  const diffInSeconds = (date.getTime() - now.getTime()) / 1000

  if (Math.abs(diffInSeconds) < 60) return rtf.format(Math.round(diffInSeconds), 'second')
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute')
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
  if (Math.abs(diffInSeconds) < 604800) return rtf.format(Math.round(diffInSeconds / 86400), 'day')

  return formatAbsolute(date, locale, showTime)
}

export const SmartDate = ({ date, className, showTime = true, mode = 'relative' }: SmartDateProps) => {
  const { locale } = useLocale()
  const rerender = useRerender()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const tick = () => {
      const now = new Date()
      const diff = Math.abs((date.getTime() - now.getTime()) / 1000)
      const SEVEN_DAYS = 604800

      if (diff > SEVEN_DAYS) return

      let delay = 3600000
      if (diff < 60) {
        delay = 1000
      } else if (diff < 3600) {
        delay = 60000
      }

      timeoutId = setTimeout(() => {
        rerender()
        tick()
      }, delay)
    }

    tick()

    return () => clearTimeout(timeoutId)
  }, [date, rerender])

  if (!date) return null

  const absoluteString = formatAbsolute(date, locale, showTime)
  const relativeString = formatRelative(date, locale, showTime)

  const displayString = mode === 'relative' ? relativeString : absoluteString
  const tooltipString = mode === 'relative' ? absoluteString : relativeString

  return (
    <Tooltip tooltip={tooltipString} position="top">
      <span className={clsx('cursor-help underline decoration-dotted decoration-neutral-300 underline-offset-2', className)}>
        {displayString}
      </span>
    </Tooltip>
  )
}

type CurrentTimeProps = {
  className?: string,
  showDate?: boolean,
}

const formatCurrentTime = (date: Date, locale: string, showDate: boolean) => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }

  if (showDate) {
    options.year = 'numeric'
    options.month = '2-digit'
    options.day = '2-digit'
  }

  return new Intl.DateTimeFormat(locale, options).format(date)
}

export const CurrentTime = ({ className, showDate = false }: CurrentTimeProps) => {
  const { locale } = useLocale()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatted = formatCurrentTime(now, locale, showDate)
  const formattedExpanded = formatCurrentTime(now, locale, true)

  return (
    <Tooltip tooltip={formattedExpanded} position="top">
      <span className={clsx('tabular-nums cursor-default', className)}>
        {formatted}
      </span>
    </Tooltip>
  )
}
