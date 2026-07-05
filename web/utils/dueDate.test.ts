import { describe, expect, it } from 'vitest'
import { DueDateUtils } from '@/utils/dueDate'

describe('DueDateUtils.isDateOnly', () => {
  it('returns true for a date-only due date (end of day sentinel)', () => {
    const date = new Date(2026, 5, 10, 23, 59, 59, 999)
    expect(DueDateUtils.isDateOnly(date)).toBe(true)
  })

  it('returns false for a due date with a real time of day', () => {
    const date = new Date(2026, 5, 10, 9, 30, 0, 0)
    expect(DueDateUtils.isDateOnly(date)).toBe(false)
  })

  it('returns false when the time is only partially matching the sentinel', () => {
    const date = new Date(2026, 5, 10, 23, 59, 59, 0)
    expect(DueDateUtils.isDateOnly(date)).toBe(false)
  })

  it('returns false for null, undefined and invalid input', () => {
    expect(DueDateUtils.isDateOnly(null)).toBe(false)
    expect(DueDateUtils.isDateOnly(undefined)).toBe(false)
    expect(DueDateUtils.isDateOnly('not-a-date')).toBe(false)
  })
})

describe('DueDateUtils.parseFromApi', () => {
  it('round-trips a local date-only due date serialized with toISOString', () => {
    const localDateOnly = new Date(2026, 5, 10, 23, 59, 59, 999)
    const serialized = DueDateUtils.serializeForApi(localDateOnly)
    const parsed = DueDateUtils.parseFromApi(serialized)

    expect(parsed).toBeDefined()
    expect(DueDateUtils.isDateOnly(parsed)).toBe(true)
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(5)
    expect(parsed?.getDate()).toBe(10)
    expect(parsed?.getHours()).toBe(23)
    expect(parsed?.getMinutes()).toBe(59)
  })

  it('repairs legacy date-only values stored as UTC wall clock', () => {
    const legacy = '2026-06-10T23:59:59.999Z'
    const parsed = DueDateUtils.parseFromApi(legacy)

    expect(parsed).toBeDefined()
    expect(DueDateUtils.isDateOnly(parsed)).toBe(true)
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(5)
    expect(parsed?.getDate()).toBe(10)
    expect(parsed?.getHours()).toBe(23)
  })

  it('returns undefined for nullish and invalid values', () => {
    expect(DueDateUtils.parseFromApi(null)).toBeUndefined()
    expect(DueDateUtils.parseFromApi(undefined)).toBeUndefined()
    expect(DueDateUtils.parseFromApi('invalid')).toBeUndefined()
  })
})

describe('DueDateUtils.resolveForDisplay', () => {
  it('formats the same wall clock as FlexibleDateTimeInput for a zoned due datetime', () => {
    const apiValue = '2002-02-02T23:00:00.000Z'
    const zoned = DueDateUtils.parseFromApi(apiValue, 'Europe/Berlin')
    const resolved = DueDateUtils.resolveForDisplay(apiValue, 'Europe/Berlin')

    expect(zoned).toBeDefined()
    expect(resolved?.zoned.getFullYear()).toBe(2002)
    expect(resolved?.zoned.getMonth()).toBe(1)
    expect(resolved?.zoned.getDate()).toBe(3)
    expect(resolved?.zoned.getHours()).toBe(0)
    expect(resolved?.zoned.getMinutes()).toBe(0)
    expect(resolved?.instant.toISOString()).toBe(apiValue)
  })
})

describe('DueDateUtils.serializeForApi', () => {
  it('returns null for nullish values', () => {
    expect(DueDateUtils.serializeForApi(null)).toBeNull()
    expect(DueDateUtils.serializeForApi(undefined)).toBeNull()
  })
})

const wallClock = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
  hours: date.getHours(),
  minutes: date.getMinutes(),
  seconds: date.getSeconds(),
  milliseconds: date.getMilliseconds(),
})

describe('DueDateUtils.dateTimeInHours', () => {
  it('returns the current wall clock in the app timezone with zeroed seconds for an offset of 0', () => {
    const now = new Date('2026-07-05T14:32:41.512Z')
    const result = DueDateUtils.dateTimeInHours(0, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 6, day: 5, hours: 16, minutes: 32, seconds: 0, milliseconds: 0 })
  })

  it('adds the given number of hours', () => {
    const now = new Date('2026-07-05T14:32:41.512Z')
    const result = DueDateUtils.dateTimeInHours(3, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 6, day: 5, hours: 19, minutes: 32, seconds: 0, milliseconds: 0 })
  })

  it('rolls over to the next day for offsets crossing midnight', () => {
    const now = new Date('2026-07-05T20:00:00.000Z')
    const result = DueDateUtils.dateTimeInHours(6, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 6, day: 6, hours: 4, minutes: 0, seconds: 0, milliseconds: 0 })
  })

  it('never produces a date-only value', () => {
    const now = new Date('2026-07-05T21:59:59.999Z')
    for (const hours of [0, 1, 3, 6, 12, 24]) {
      expect(DueDateUtils.isDateOnly(DueDateUtils.dateTimeInHours(hours, now, 'Europe/Berlin'))).toBe(false)
    }
  })
})

describe('DueDateUtils.dateOnlyInDays', () => {
  it('returns the end-of-day sentinel for today with an offset of 0', () => {
    const now = new Date('2026-07-05T14:32:41.512Z')
    const result = DueDateUtils.dateOnlyInDays(0, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 6, day: 5, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
  })

  it('uses the calendar day of the app timezone, not UTC', () => {
    const now = new Date('2026-07-05T22:30:00.000Z')
    const result = DueDateUtils.dateOnlyInDays(0, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 6, day: 6, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
  })

  it('adds the given number of days', () => {
    const now = new Date('2026-07-05T14:32:41.512Z')
    expect(wallClock(DueDateUtils.dateOnlyInDays(1, now, 'Europe/Berlin')).day).toBe(6)
    expect(wallClock(DueDateUtils.dateOnlyInDays(4, now, 'Europe/Berlin')).day).toBe(9)
  })

  it('rolls over month boundaries', () => {
    const now = new Date('2026-07-30T08:00:00.000Z')
    const result = DueDateUtils.dateOnlyInDays(2, now, 'Europe/Berlin')
    expect(wallClock(result)).toEqual({ year: 2026, month: 7, day: 1, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
  })

  it('always produces a date-only value', () => {
    const now = new Date('2026-07-05T14:32:41.512Z')
    for (const days of [0, 1, 2, 4]) {
      expect(DueDateUtils.isDateOnly(DueDateUtils.dateOnlyInDays(days, now, 'Europe/Berlin'))).toBe(true)
    }
  })
})
