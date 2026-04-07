export type DateTimeFormat = 'date' | 'time' | 'dateTime'

const timesInSeconds = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  monthImprecise: 2629800,
  yearImprecise: 31557600,
} as const

export function formatAbsoluteHightide(date: Date, locale: string, format: DateTimeFormat): string {
  let options: Intl.DateTimeFormatOptions

  switch (format) {
  case 'date':
    options = {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }
    break
  case 'time':
    options = {
      hour: '2-digit',
      minute: '2-digit',
    }
    break
  case 'dateTime':
    options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
    break
  }

  return new Intl.DateTimeFormat(locale, options).format(date)
}

export function formatRelativeHightide(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = new Date()
  const diffInSeconds = (date.getTime() - now.getTime()) / 1000

  if (Math.abs(diffInSeconds) < timesInSeconds.minute) return rtf.format(Math.round(diffInSeconds), 'second')
  if (Math.abs(diffInSeconds) < timesInSeconds.hour) return rtf.format(Math.round(diffInSeconds / timesInSeconds.minute), 'minute')
  if (Math.abs(diffInSeconds) < timesInSeconds.day) return rtf.format(Math.round(diffInSeconds / timesInSeconds.hour), 'hour')
  if (Math.abs(diffInSeconds) < timesInSeconds.week) return rtf.format(Math.round(diffInSeconds / timesInSeconds.day), 'day')
  if (Math.abs(diffInSeconds) < timesInSeconds.monthImprecise) return rtf.format(Math.round(diffInSeconds / timesInSeconds.week), 'week')
  if (Math.abs(diffInSeconds) < timesInSeconds.yearImprecise) return rtf.format(Math.round(diffInSeconds / timesInSeconds.monthImprecise), 'month')

  return rtf.format(Math.round(diffInSeconds / timesInSeconds.yearImprecise), 'year')
}
