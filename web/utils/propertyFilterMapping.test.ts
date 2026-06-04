import { describe, expect, it } from 'vitest'
import { FieldType } from '@/api/gql/generated'
import { getPropertyFilterFn } from '@/utils/propertyFilterMapping'

describe('getPropertyFilterFn', () => {
  it.each([
    [FieldType.FieldTypeCheckbox, 'boolean'],
    [FieldType.FieldTypeDate, 'date'],
    [FieldType.FieldTypeDateTime, 'dateTime'],
    [FieldType.FieldTypeNumber, 'number'],
    [FieldType.FieldTypeSelect, 'singleTag'],
    [FieldType.FieldTypeMultiSelect, 'multiTags'],
    [FieldType.FieldTypeUser, 'text'],
    [FieldType.FieldTypeText, 'text'],
  ])('maps %s to %s', (fieldType, expected) => {
    expect(getPropertyFilterFn(fieldType)).toBe(expected)
  })

  it('falls back to text for unknown field types', () => {
    expect(getPropertyFilterFn('SOMETHING_ELSE' as FieldType)).toBe('text')
  })
})
