import { Chip, FillerCell, Tooltip } from '@helpwave/hightide'
import { Users } from 'lucide-react'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { FieldType } from '@/api/gql/generated'
import type { PropertyValueType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'

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
      <DateDisplay date={date} showTime={false} />
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
      <DateDisplay date={date} />
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
      <Tooltip tooltip={textValue}>
        <span className="truncate block max-w-full overflow-hidden text-ellipsis">{displayText}</span>
      </Tooltip>
    )
  }
  case FieldType.FieldTypeUser: {
    if (property.user) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <AvatarStatusComponent
            size="sm"
            isOnline={property.user.isOnline ?? null}
            image={property.user.avatarUrl ? {
              avatarUrl: property.user.avatarUrl,
              alt: property.user.name,
            } : undefined}
          />
          <span className="truncate">{property.user.name}</span>
        </div>
      )
    }
    if (property.team) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Users className="size-4 text-description flex-shrink-0" />
          <span className="truncate">{property.team.title}</span>
        </div>
      )
    }
    if (property.userValue) {
      return (
        <span className="truncate block">{property.userValue}</span>
      )
    }
    return <FillerCell />
  }
  default:
    return <FillerCell />
  }
}