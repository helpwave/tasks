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
    const parsed = parseApiDateTime(value, timeZone)
    if (!parsed) return undefined
    if (DueDateUtils.isDateOnly(parsed)) {
      return parsed
    }
    if (isUtcDateOnlySentinel(parsed)) {
      return fromUtcWallClock(parsed)
    }
    return parsed
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
