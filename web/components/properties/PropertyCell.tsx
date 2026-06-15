import { Chip, FillerCell, Tooltip } from '@helpwave/hightide'
import { Users } from 'lucide-react'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { FieldType } from '@/api/gql/generated'
import type { PropertyValueType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { parseApiDateTime, parseLocalCalendarDate } from '@/utils/calendarDate'

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
        size="sm"
        className="coloring-tonal"
        color={property.booleanValue ? 'positive' : 'negative'}
      >
        {property.booleanValue ? translation('yes') : translation('no')}
      </Chip>
    )
  case FieldType.FieldTypeDate: {
    const date = parseLocalCalendarDate(property.dateValue ?? undefined)
    if (!date) {
      return <FillerCell />
    }
    return (
      <DateDisplay date={date} showTime={false} mode="absolute" />
    )
  }
  case FieldType.FieldTypeDateTime: {
    const date = parseApiDateTime(property.dateTimeValue ?? undefined)
    if (!date) {
      return <FillerCell />
    }
    return (
      <DateDisplay date={date} mode="absolute" />
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
      <div className="flex flex-wrap gap-1 w-full max-w-full min-w-0">
        <Chip size="sm" className="primary coloring-tonal max-w-full min-w-0">
          <span className="truncate min-w-0">{selectOptionName}</span>
        </Chip>
      </div>
    )
  }
  case FieldType.FieldTypeMultiSelect: {
    if (!property.multiSelectValues || property.multiSelectValues.length === 0) {
      return <FillerCell />
    }
    return (
      <div className="flex flex-wrap gap-1 w-full max-w-full min-w-0">
        {property.multiSelectValues.map((val) => {
          const multiSelectOptionIndex = val.match(/-opt-(\d+)$/)?.[1]
          const multiSelectOptionName = multiSelectOptionIndex !== undefined && property.definition?.options
            ? property.definition.options[parseInt(multiSelectOptionIndex, 10)]
            : val
          return (
            <Chip key={val} size="sm" className="primary coloring-tonal max-w-full min-w-0">
              <span className="truncate min-w-0">{multiSelectOptionName}</span>
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
    return (
      <Tooltip tooltip={textValue}>
        <span className="truncate block max-w-full overflow-hidden text-ellipsis">{textValue}</span>
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
          <span className="truncate min-w-0">{property.user.name}</span>
        </div>
      )
    }
    if (property.team) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Users className="size-4 text-description flex-shrink-0" />
          <span className="truncate min-w-0">{property.team.title}</span>
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