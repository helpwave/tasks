import type { PropertyValueInput } from '@/api/gql/generated'
import type { PropertyValue } from '@/components/tables/PropertyList'
import { formatLocalCalendarDate, serializeDateTimeForApi } from '@/utils/calendarDate'

export function propertyValueToInput(definitionId: string, value: PropertyValue): PropertyValueInput {
  return {
    definitionId,
    textValue: value.textValue ?? undefined,
    numberValue: value.numberValue ?? undefined,
    booleanValue: value.boolValue ?? undefined,
    dateValue: value.dateValue ? formatLocalCalendarDate(value.dateValue) : undefined,
    dateTimeValue: value.dateTimeValue ? serializeDateTimeForApi(value.dateTimeValue) : undefined,
    selectValue: value.singleSelectValue ?? undefined,
    multiSelectValues: value.multiSelectValue ?? undefined,
    userValue: value.userValue ?? undefined,
  }
}
