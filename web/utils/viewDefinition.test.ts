import { describe, expect, it } from 'vitest'
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'
import {
  columnOrderMatchesBaselineForDirty,
  deserializeColumnFiltersFromView,
  deserializeSortingFromView,
  expandVisibilityWithPropertyColumnDefaults,
  hasActiveLocationFilter,
  normalizedVisibilityForViewCompare,
  parseViewParameters,
  serializeColumnFiltersForView,
  serializeSortingForView,
  tableViewStateMatchesBaseline,
  visibilityMatchesViewBaseline
} from '@/utils/viewDefinition'

describe('hasActiveLocationFilter', () => {
  it('detects a position filter with a single uuid value', () => {
    const filters = [
      { id: 'position', value: { parameter: { uuidValue: 'loc-1' } } },
    ] as unknown as ColumnFiltersState
    expect(hasActiveLocationFilter(filters)).toBe(true)
  })

  it('detects a locationSubtree filter with uuid values', () => {
    const filters = [
      { id: 'locationSubtree', value: { parameter: { uuidValues: ['loc-1'] } } },
    ] as unknown as ColumnFiltersState
    expect(hasActiveLocationFilter(filters)).toBe(true)
  })

  it('ignores non-location filters and empty parameters', () => {
    const filters = [
      { id: 'name', value: { parameter: { uuidValue: 'x' } } },
      { id: 'position', value: { parameter: { uuidValue: '' } } },
      { id: 'position', value: { parameter: { uuidValues: [] } } },
    ] as unknown as ColumnFiltersState
    expect(hasActiveLocationFilter(filters)).toBe(false)
  })
})

describe('normalizedVisibilityForViewCompare', () => {
  it('is independent of key insertion order', () => {
    expect(normalizedVisibilityForViewCompare({ a: true, b: false }))
      .toBe(normalizedVisibilityForViewCompare({ b: false, a: true }))
  })

  it('matches an equivalent baseline regardless of order', () => {
    expect(visibilityMatchesViewBaseline({ a: true, b: false }, { b: false, a: true })).toBe(true)
    expect(visibilityMatchesViewBaseline({ a: true }, { a: false })).toBe(false)
  })
})

describe('expandVisibilityWithPropertyColumnDefaults', () => {
  it('defaults unknown property columns to hidden without overriding explicit values', () => {
    const result = expandVisibilityWithPropertyColumnDefaults(
      { property_1: true },
      ['property_1', 'property_2']
    )
    expect(result).toEqual({ property_1: true, property_2: false })
  })

  it('returns the input untouched when there are no property columns', () => {
    const input = { a: true }
    expect(expandVisibilityWithPropertyColumnDefaults(input, [])).toBe(input)
  })
})

describe('columnOrderMatchesBaselineForDirty', () => {
  it('treats an empty baseline as always matching', () => {
    expect(columnOrderMatchesBaselineForDirty(['a', 'b'], [])).toBe(true)
  })

  it('compares against a non-empty baseline exactly', () => {
    expect(columnOrderMatchesBaselineForDirty(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(columnOrderMatchesBaselineForDirty(['b', 'a'], ['a', 'b'])).toBe(false)
  })
})

describe('parseViewParameters', () => {
  it('parses a valid object', () => {
    expect(parseViewParameters('{"searchQuery":"hi"}')).toEqual({ searchQuery: 'hi' })
  })

  it('returns an empty object for invalid json or non-objects', () => {
    expect(parseViewParameters('not json')).toEqual({})
    expect(parseViewParameters('42')).toEqual({})
    expect(parseViewParameters('null')).toEqual({})
  })
})

describe('column filter serialization round-trip', () => {
  it('serializes date parameters to ISO strings and restores them as Date instances', () => {
    const date = new Date('2026-01-02T03:04:05.000Z')
    const filters = [
      {
        id: 'dueDate',
        value: {
          operator: 'between',
          dataType: 'date',
          parameter: { dateValue: date },
        },
      },
    ] as unknown as ColumnFiltersState

    const serialized = serializeColumnFiltersForView(filters)
    expect(serialized).toContain('2026-01-02T03:04:05.000Z')

    const restored = deserializeColumnFiltersFromView(serialized)
    const restoredDate = (restored[0]!.value as { parameter: { dateValue?: Date } }).parameter.dateValue
    expect(restoredDate).toBeInstanceOf(Date)
    expect(restoredDate?.toISOString()).toBe(date.toISOString())
  })

  it('remaps the legacy locationSubtree id to position on deserialize', () => {
    const json = JSON.stringify([
      { id: 'locationSubtree', value: { operator: 'eq', dataType: 'text', parameter: {} } },
    ])
    expect(deserializeColumnFiltersFromView(json)[0]!.id).toBe('position')
  })

  it('returns an empty array for malformed filter json', () => {
    expect(deserializeColumnFiltersFromView('not json')).toEqual([])
  })
})

describe('sorting serialization', () => {
  it('round-trips a sorting state', () => {
    const sorting = [{ id: 'dueDate', desc: true }] as SortingState
    expect(deserializeSortingFromView(serializeSortingForView(sorting))).toEqual(sorting)
  })

  it('returns an empty array for non-array or malformed json', () => {
    expect(deserializeSortingFromView('{}')).toEqual([])
    expect(deserializeSortingFromView('not json')).toEqual([])
  })
})

describe('tableViewStateMatchesBaseline', () => {
  const base = {
    filters: [] as ColumnFiltersState,
    baselineFilters: [] as ColumnFiltersState,
    sorting: [] as SortingState,
    baselineSorting: [] as SortingState,
    searchQuery: '',
    baselineSearch: '',
    columnVisibility: {},
    baselineColumnVisibility: {},
    columnOrder: [],
    baselineColumnOrder: [],
    propertyColumnIds: [],
  }

  it('returns true when nothing diverges from the baseline', () => {
    expect(tableViewStateMatchesBaseline(base)).toBe(true)
  })

  it('returns false when the search query diverges', () => {
    expect(tableViewStateMatchesBaseline({ ...base, searchQuery: 'changed' })).toBe(false)
  })

  it('returns false when sorting diverges', () => {
    expect(tableViewStateMatchesBaseline({
      ...base,
      sorting: [{ id: 'dueDate', desc: true }] as SortingState,
    })).toBe(false)
  })
})
