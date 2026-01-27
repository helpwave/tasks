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
  case FieldType.FieldTypeDate: {
    if (!property.dateValue) {
      return <FillerCell />
    }
    const date = property.dateValue instanceof Date
      ? property.dateValue
      : new Date(property.dateValue)
    if (isNaN(date.getTime())) {
      return <FillerCell />
    }
    return (
      <SmartDate date={date} showTime={false} />
    )
  }
  case FieldType.FieldTypeDateTime: {
    if (!property.dateTimeValue) {
      return <FillerCell />
    }
    const date = property.dateTimeValue instanceof Date
      ? property.dateTimeValue
      : new Date(property.dateTimeValue)
    if (isNaN(date.getTime())) {
      return <FillerCell />
    }
    return (
      <SmartDate date={date} />
    )
  }
  case FieldType.FieldTypeSelect: {
    if (!property.selectValue) {
      return <FillerCell />
    }
    const selectOptionIndex = property.selectValue.match(/-opt-(\d+)$/)?.[1]
    const selectOptionName = selectOptionIndex !== undefined && property.definition?.options
      ? property.definition.options[parseInt(selectOptionIndex, 10)]
      : property.selectValue
    return (
      <div className="flex flex-wrap gap-1">
        <Chip className="primary coloring-tonal">
          {selectOptionName}
        </Chip>
      </div>
    )
  }
  case FieldType.FieldTypeMultiSelect: {
    if (!property.multiSelectValues || property.multiSelectValues.length === 0) {
      return <FillerCell />
    }
    return (
      <div className="flex flex-wrap gap-1">
        {property.multiSelectValues.map((val) => {
          const multiSelectOptionIndex = val.match(/-opt-(\d+)$/)?.[1]
          const multiSelectOptionName = multiSelectOptionIndex !== undefined && property.definition?.options
            ? property.definition.options[parseInt(multiSelectOptionIndex, 10)]
            : val
          return (
            <Chip key={val} className="primary coloring-tonal">
              {multiSelectOptionName}
            </Chip>
          )
        })}
      </div>
    )
  }
  case FieldType.FieldTypeNumber:
    return (
      <span className="truncate block">{property.numberValue}</span>
    )
  case FieldType.FieldTypeText: {
    const textValue = property.textValue ?? property.numberValue ?? ''
    const displayText = typeof textValue === 'string' && textValue.length > 15
      ? `${textValue.substring(0, 15)}...`
      : String(textValue)
    return (
      <Tooltip tooltip={textValue} tooltipClassName="whitespace-wrap">
        <span className="truncate block max-w-full overflow-hidden text-ellipsis">{displayText}</span>
      </Tooltip>
    )
  }
  default:
    return <FillerCell />
  }
}