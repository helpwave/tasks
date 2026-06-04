import { FieldType } from '@/api/gql/generated'
import type { DataType } from '@helpwave/hightide'

export function getPropertyFilterFn(fieldType: FieldType): DataType {
  switch (fieldType) {
  case FieldType.FieldTypeCheckbox:
    return 'boolean'
  case FieldType.FieldTypeDate:
    return 'date'
  case FieldType.FieldTypeDateTime:
    return 'dateTime'
  case FieldType.FieldTypeNumber:
    return 'number'
  case FieldType.FieldTypeSelect:
    return 'singleTag'
  case FieldType.FieldTypeMultiSelect:
    return 'multiTags'
  case FieldType.FieldTypeUser:
    return 'text'
  default:
    return 'text'
  }
}
