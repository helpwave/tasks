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
