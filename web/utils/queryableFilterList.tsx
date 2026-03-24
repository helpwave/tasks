import type { ReactNode } from 'react'
import type { FilterListItem, FilterListPopUpBuilderProps, FilterValue } from '@helpwave/hightide'
import type { DataType } from '@helpwave/hightide'
import type { QueryableField } from '@/api/gql/generated'
import { FieldType, QueryableFieldKind, QueryableValueType } from '@/api/gql/generated'
import { AssigneeFilterActiveLabel } from '@/components/tables/AssigneeFilterActiveLabel'
import { LocationFilterActiveLabel } from '@/components/tables/LocationFilterActiveLabel'
import { LocationSubtreeFilterPopUp } from '@/components/tables/LocationSubtreeFilterPopUp'
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

function filterFieldDataType(field: QueryableField): DataType {
  if (field.key === 'position' || field.key === 'assignee') return 'singleTag'
  return valueKindToDataType(field)
}

export type QueryableSortListItem = Pick<FilterListItem, 'id' | 'label' | 'dataType'>
export type QueryableFieldLabelResolver = (field: QueryableField) => string

export function queryableFieldsToFilterListItems(
  fields: QueryableField[],
  propertyFieldTypeByDefId: Map<string, FieldType>,
  resolveLabel?: QueryableFieldLabelResolver
): FilterListItem[] {
  return fields.filter(field => field.filterable).map((field): FilterListItem => {
    const dataType = filterFieldDataType(field)
    const label = resolveLabel ? resolveLabel(field) : field.label
    const tags = field.choice
      ? field.choice.optionLabels.map((label, idx) => ({
        label,
        tag: field.choice!.optionKeys[idx] ?? label,
      }))
      : []

    const ft = field.propertyDefinitionId
      ? propertyFieldTypeByDefId.get(field.propertyDefinitionId)
      : undefined

    const isUserFilterUi = ft === FieldType.FieldTypeUser || field.key === 'assignee'

    return {
      id: field.key,
      label,
      dataType,
      tags,
      activeLabelBuilder: field.key === 'position'
        ? (v: FilterValue): ReactNode => (
          <>
            <span className="font-bold">{label}</span>
            <LocationFilterActiveLabel value={v} />
          </>
        )
        : isUserFilterUi
          ? (v: FilterValue): ReactNode => (
            <>
              <span className="font-bold">{label}</span>
              <AssigneeFilterActiveLabel value={v} />
            </>
          )
          : undefined,
      popUpBuilder: isUserFilterUi
        ? (props: FilterListPopUpBuilderProps): ReactNode => (<UserSelectFilterPopUp {...props} />)
        : field.key === 'position'
          ? (props: FilterListPopUpBuilderProps): ReactNode => (<LocationSubtreeFilterPopUp {...props} />)
          : undefined,
    }
  })
}

export function queryableFieldsToSortingListItems(
  fields: QueryableField[],
  resolveLabel?: QueryableFieldLabelResolver
): QueryableSortListItem[] {
  return fields
    .filter(field => field.sortable && field.sortDirections.length > 0)
    .map((field): QueryableSortListItem => ({
      id: field.key,
      label: resolveLabel ? resolveLabel(field) : field.label,
      dataType: valueKindToDataType(field),
    }))
}
