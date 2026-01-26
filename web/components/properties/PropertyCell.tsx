import { Chip, FillerCell, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { FieldType } from '@/api/gql/generated'
import type { PropertyValueType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export interface PropertyCellProps {
  property?: PropertyValueType | undefined,
  fieldType: FieldType,
}


export const PropertyCell = ({
  property,
  fieldType,
}: PropertyCellProps) => {
  const translation = useTasksTranslation()


  if (!property) {
    return <FillerCell />
  }

  switch (fieldType) {
  case FieldType.FieldTypeCheckbox:
    return (
      <Chip
        className="coloring-tonal"
        color={property.booleanValue ? 'positive' : 'negative'}
      >
        {property.booleanValue ? translation('yes') : translation('no')}
      </Chip>
    )
  case FieldType.FieldTypeDate:
    return (
      <SmartDate date={property.dateValue ?? new Date()} showTime={false} />
    )
  case FieldType.FieldTypeDateTime:
    return (
      <SmartDate date={property.dateTimeValue ?? new Date()} />
    )
  case FieldType.FieldTypeSelect:
    return (
      <Chip className="primary coloring-tonal">
        {property.selectValue}
      </Chip>
    )
  case FieldType.FieldTypeMultiSelect:
    return (
      <div className="flex flex-wrap gap-1">
        {property.multiSelectValues?.map((val) => {
          return (
            <Chip key={val} className="primary coloring-tonal">
              {val}
            </Chip>
          )
        })}
      </div>
    )
  case FieldType.FieldTypeNumber:
    return (
      <span className="truncate">{property.numberValue}</span>
    )
  case FieldType.FieldTypeText:
    return (
      <Tooltip tooltip={property.textValue} tooltipClassName="whitespace-wrap">
        <span className="truncate">{property.textValue ?? property.numberValue}</span>
      </Tooltip>
    )
  default:
    return <FillerCell />
  }
}