const DATE_ONLY_HOURS = 23
const DATE_ONLY_MINUTES = 59
const DATE_ONLY_SECONDS = 59
const DATE_ONLY_MILLISECONDS = 999

export const TASK_DUE_DATE_DATE_TIME_INPUT_PROPS = {
  is24HourFormat: true,
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

  parseFromApi: (value: string | Date | null | undefined): Date | undefined => {
    if (value == null) return undefined
    const parsed = typeof value === 'string' ? new Date(value) : new Date(value.getTime())
    if (Number.isNaN(parsed.getTime())) return undefined
    if (DueDateUtils.isDateOnly(parsed)) {
      return parsed
    }
    if (isUtcDateOnlySentinel(parsed)) {
      return fromUtcWallClock(parsed)
    }
    return parsed
  },

  serializeForApi: (dueDate: Date | null | undefined): string | null => {
    if (!dueDate) return null
    return dueDate.toISOString()
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
