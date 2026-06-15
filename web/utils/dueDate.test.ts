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

describe('DueDateUtils.serializeForApi', () => {
  it('returns null for nullish values', () => {
    expect(DueDateUtils.serializeForApi(null)).toBeNull()
    expect(DueDateUtils.serializeForApi(undefined)).toBeNull()
  })
})
