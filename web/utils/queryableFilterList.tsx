import type { ReactNode } from 'react'
import type { FilterListItem, FilterListPopUpBuilderProps } from '@helpwave/hightide'
import type { DataType } from '@helpwave/hightide'
import type { QueryableField } from '@/api/gql/generated'
import { FieldType, QueryableFieldKind, QueryableValueType } from '@/api/gql/generated'
import { UserSelectFilterPopUp } from '@/components/tables/UserSelectFilterPopUp'

function valueKindToDataType(field: QueryableField): DataType {
  const vt = field.valueType
  const k = field.kind
  if (k === QueryableFieldKind.Choice) return 'singleTag'
  if (k === QueryableFieldKind.ChoiceList) return 'multiTags'
  if (k === QueryableFieldKind.Reference) return 'text'
  if (vt === QueryableValueType.Boolean) return 'boolean'
  if (vt === QueryableValueType.Number) return 'number'
  if (vt === QueryableValueType.Date) return 'date'
  if (vt === QueryableValueType.Datetime) return 'dateTime'
  return 'text'
}

export function queryableFieldsToFilterListItems(
  fields: QueryableField[],
  propertyFieldTypeByDefId: Map<string, FieldType>
): FilterListItem[] {
  return fields.map((field): FilterListItem => {
    const dataType = valueKindToDataType(field)
    const tags = field.choice
      ? field.choice.optionLabels.map((label, idx) => ({
        label,
        tag: field.choice!.optionKeys[idx] ?? label,
      }))
      : []

    const ft = field.propertyDefinitionId
      ? propertyFieldTypeByDefId.get(field.propertyDefinitionId)
      : undefined

    return {
      id: field.key,
      label: field.label,
      dataType,
      tags,
      popUpBuilder: ft === FieldType.FieldTypeUser
        ? (props: FilterListPopUpBuilderProps): ReactNode => (<UserSelectFilterPopUp {...props} />)
        : undefined,
    }
  })
}
