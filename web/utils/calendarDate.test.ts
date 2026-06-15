import { describe, expect, it } from 'vitest'
import {
  formatLocalCalendarDate,
  parseApiDateTime,
  parseLocalCalendarDate,
  samePropertyDateInputValue,
  serializeDateTimeForApi
} from '@/utils/calendarDate'

const berlin = 'Europe/Berlin'

describe('parseLocalCalendarDate', () => {
  it('parses YYYY-MM-DD in the app timezone for date inputs', () => {
    const parsed = parseLocalCalendarDate('2026-06-15', berlin)
    expect(parsed).toBeDefined()
    expect(formatLocalCalendarDate(parsed!, berlin)).toBe('2026-06-15')
  })
})

describe('formatLocalCalendarDate', () => {
  it('formats using app timezone calendar parts', () => {
    const parsed = parseLocalCalendarDate('2026-06-15', berlin)
    expect(formatLocalCalendarDate(parsed!, berlin)).toBe('2026-06-15')
  })
})

describe('parseApiDateTime', () => {
  it('treats naive backend datetimes as UTC instants', () => {
    const parsed = parseApiDateTime('2026-06-15T13:00:00', berlin)
    expect(parsed).toBeDefined()
    expect(serializeDateTimeForApi(parsed!, berlin)).toBe('2026-06-15T13:00:00.000Z')
  })

  it('preserves explicit timezone offsets', () => {
    const parsed = parseApiDateTime('2026-06-15T13:00:00.000Z', berlin)
    expect(serializeDateTimeForApi(parsed!, berlin)).toBe('2026-06-15T13:00:00.000Z')
  })
})

describe('samePropertyDateInputValue', () => {
  it('compares date-only values by app timezone calendar day', () => {
    const first = parseLocalCalendarDate('2026-06-15', berlin)!
    const second = parseLocalCalendarDate('2026-06-15', berlin)!
    expect(samePropertyDateInputValue(first, second, 'date', berlin)).toBe(true)
  })
})
