import { parseApiDateTime, serializeDateTimeForApi } from '@/utils/calendarDate'
import { DateUtils } from '@helpwave/hightide'

const DATE_ONLY_HOURS = 23
const DATE_ONLY_MINUTES = 59
const DATE_ONLY_SECONDS = 59
const DATE_ONLY_MILLISECONDS = 999

export const TASK_DUE_DATE_DATE_TIME_INPUT_PROPS = {
  millisecondIncrement: '100ms' as const,
  minuteIncrement: '5min' as const,
  precision: 'minute' as const,
  secondIncrement: '1s' as const,
}

export const getTaskDueDateFlexibleInputProps = (
  defaultMode: 'date' | 'dateTime' = 'date'
) => ({
  ...TASK_DUE_DATE_DATE_TIME_INPUT_PROPS,
  defaultMode,
  fixedTime: new Date(1970, 0, 1, DATE_ONLY_HOURS, DATE_ONLY_MINUTES, DATE_ONLY_SECONDS, DATE_ONLY_MILLISECONDS),
})

const isUtcDateOnlySentinel = (date: Date): boolean => {
  return date.getUTCHours() === DATE_ONLY_HOURS
    && date.getUTCMinutes() === DATE_ONLY_MINUTES
    && date.getUTCSeconds() === DATE_ONLY_SECONDS
    && date.getUTCMilliseconds() === DATE_ONLY_MILLISECONDS
}

const fromUtcWallClock = (date: Date): Date => {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  )
}

const parseRawApiInstant = (value: string | Date): Date | undefined => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }

  const trimmed = value.trim()
  if (!trimmed || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined

  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(trimmed)
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export const DueDateUtils = {
  fixedTimeTemplate: (): Date => {
    return getTaskDueDateFlexibleInputProps().fixedTime
  },

  isDateOnly: (dueDate: Date | string | undefined | null): boolean => {
    if (!dueDate) return false
    const date = new Date(dueDate)
    if (Number.isNaN(date.getTime())) return false
    return date.getHours() === DATE_ONLY_HOURS
      && date.getMinutes() === DATE_ONLY_MINUTES
      && date.getSeconds() === DATE_ONLY_SECONDS
      && date.getMilliseconds() === DATE_ONLY_MILLISECONDS
  },

  parseFromApi: (value: string | Date | null | undefined, timeZone?: string): Date | undefined => {
    if (value != null) {
      const rawInstant = parseRawApiInstant(value)
      if (rawInstant && isUtcDateOnlySentinel(rawInstant)) {
        return fromUtcWallClock(rawInstant)
      }
    }

    return parseApiDateTime(value, timeZone)
  },

  toDisplayInstant: (zonedDueDate: Date, timeZone: string): Date => {
    return DateUtils.fromZonedDate(zonedDueDate, timeZone)
  },

  resolveForDisplay: (
    value: string | Date | null | undefined,
    timeZone: string
  ): { zoned: Date, instant: Date, isDateOnly: boolean } | undefined => {
    const zoned = typeof value === 'string' || value == null
      ? DueDateUtils.parseFromApi(value, timeZone)
      : value
    if (!zoned) return undefined
    const isDateOnly = DueDateUtils.isDateOnly(zoned)
    return {
      zoned,
      instant: DueDateUtils.toDisplayInstant(zoned, timeZone),
      isDateOnly,
    }
  },

  serializeForApi: (dueDate: Date | null | undefined, timeZone?: string): string | null => {
    if (!dueDate) return null
    return serializeDateTimeForApi(dueDate, timeZone)
  },

  isOverdue: (dueDate: Date | undefined | null, done: boolean): boolean => {
    if (!dueDate || done) return false
    return new Date(dueDate).getTime() < Date.now()
  },

  isCloseToDueDate: (dueDate: Date | undefined | null, done: boolean): boolean => {
    if (!dueDate || done) return false
    const now = Date.now()
    const dueTime = new Date(dueDate).getTime()
    const oneHour = 60 * 60 * 1000
    return dueTime > now && dueTime - now <= oneHour
  },
}
