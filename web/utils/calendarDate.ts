import { DateUtils } from '@helpwave/hightide'
import { getConfig } from '@/utils/config'

export function getAppTimezone(): string {
  return getConfig().timezone
}

function parseCalendarParts(value: string): { year: number, month: number, day: number } | undefined {
  const datePart = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match?.[1] || !match[2] || !match[3]) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return undefined

  return { year, month, day }
}

export function formatLocalCalendarDate(date: Date, timeZone: string = getAppTimezone()): string {
  const instant = DateUtils.fromZonedDate(date, timeZone)
  const parts = DateUtils.zonedParts(instant, timeZone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function parseLocalCalendarDate(
  value: string | Date | null | undefined,
  timeZone: string = getAppTimezone()
): Date | undefined {
  if (value == null) return undefined

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return DateUtils.toZonedDate(value, timeZone)
  }

  const parts = parseCalendarParts(value)
  if (!parts) return undefined

  const instant = DateUtils.fromZonedDate(
    new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0),
    timeZone
  )
  if (Number.isNaN(instant.getTime())) return undefined

  return DateUtils.toZonedDate(instant, timeZone)
}

export function serializeDateTimeForApi(date: Date, timeZone: string = getAppTimezone()): string {
  return DateUtils.fromZonedDate(date, timeZone).toISOString()
}

export function parseApiDateTime(
  value: string | Date | null | undefined,
  timeZone: string = getAppTimezone()
): Date | undefined {
  if (value == null) return undefined

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return DateUtils.toZonedDate(value, timeZone)
  }

  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseLocalCalendarDate(trimmed, timeZone)
  }

  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed)
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return undefined

  return DateUtils.toZonedDate(parsed, timeZone)
}

export function samePropertyDateInputValue(
  a: Date | null,
  b: Date | null,
  mode: 'date' | 'dateTime',
  timeZone: string = getAppTimezone()
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false

  if (mode === 'dateTime') {
    return DateUtils.fromZonedDate(a, timeZone).getTime() === DateUtils.fromZonedDate(b, timeZone).getTime()
  }

  const partsA = DateUtils.zonedParts(DateUtils.fromZonedDate(a, timeZone), timeZone)
  const partsB = DateUtils.zonedParts(DateUtils.fromZonedDate(b, timeZone), timeZone)

  return partsA.year === partsB.year
    && partsA.month === partsB.month
    && partsA.day === partsB.day
}
