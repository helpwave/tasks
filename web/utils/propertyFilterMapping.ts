import { FieldType } from '@/api/gql/generated'

/**
 * Maps a FieldType to the appropriate filter function name for TanStack Table.
 * This ensures consistent filter behavior across all property columns.
 *
 * Differentiates between:
 * - date vs datetime (for proper date/time filtering)
 * - tags (multi-select) vs tags_single (single select)
 */
export function getPropertyFilterFn(fieldType: FieldType): string {
  switch (fieldType) {
  case FieldType.FieldTypeCheckbox:
    return 'boolean'
  case FieldType.FieldTypeDate:
    return 'date'
  case FieldType.FieldTypeDateTime:
    return 'datetime'
  case FieldType.FieldTypeNumber:
    return 'number'
  case FieldType.FieldTypeSelect:
    return 'tags_single'
  case FieldType.FieldTypeMultiSelect:
    return 'tags'
  default:
    return 'text'
  }
}
