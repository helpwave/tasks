import type { ColumnDef } from '@tanstack/table-core'
import { Chip, FillerCell } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { ColumnType, FieldType, type PropertyDefinitionType, type PropertyValueType } from '@/api/gql/generated'
import { getPropertyFilterFn } from './propertyFilterMapping'

type PropertyValue = PropertyValueType & {
  definition: PropertyDefinitionType,
}

type RowWithProperties = {
  properties?: PropertyValue[] | null,
}

const extractOptionIndex = (value: string): number | null => {
  const match = value.match(/-opt-(\d+)$/)
  return match && match[1] ? parseInt(match[1], 10) : null
}

function renderPropertyCell(
  property: PropertyValue | undefined,
  prop: PropertyDefinitionType,
  translate: (key: string, values?: Record<string, unknown>) => string,
  fillerCellClassName: string
): React.ReactNode {
  if (!property) {
    return <FillerCell className={fillerCellClassName} />
  }

  if (typeof property.booleanValue === 'boolean') {
    return (
      <Chip
        className="coloring-tonal"
        color={property.booleanValue ? 'positive' : 'negative'}
      >
        {property.booleanValue
          ? translate('yes')
          : translate('no')}
      </Chip>
    )
  }

  if (
    prop.fieldType === FieldType.FieldTypeDate &&
    property.dateValue
  ) {
    return (
      <SmartDate
        date={new Date(property.dateValue)}
        showTime={false}
      />
    )
  }

  if (
    prop.fieldType === FieldType.FieldTypeDateTime &&
    property.dateTimeValue
  ) {
    return (
      <SmartDate date={new Date(property.dateTimeValue)} />
    )
  }

  if (
    prop.fieldType === FieldType.FieldTypeSelect &&
    property.selectValue
  ) {
    const selectValue = property.selectValue
    const optionIndex = extractOptionIndex(selectValue)
    if (
      optionIndex !== null &&
      optionIndex >= 0 &&
      optionIndex < prop.options.length
    ) {
      return (
        <Chip className="coloring-tonal">
          {prop.options[optionIndex]}
        </Chip>
      )
    }
    return <span>{selectValue}</span>
  }

  if (
    prop.fieldType === FieldType.FieldTypeMultiSelect &&
    property.multiSelectValues &&
    property.multiSelectValues.length > 0
  ) {
    return (
      <div className="flex flex-wrap gap-1">
        {property.multiSelectValues
          .filter((val): val is string => val !== null && val !== undefined)
          .map((val, idx) => {
            const optionIndex = extractOptionIndex(val)
            const optionText =
              optionIndex !== null &&
              optionIndex >= 0 &&
              optionIndex < prop.options.length
                ? prop.options[optionIndex]
                : val
            return (
              <Chip key={idx} className="coloring-tonal">
                {optionText}
              </Chip>
            )
          })}
      </div>
    )
  }

  if (
    property.textValue !== null &&
    property.textValue !== undefined
  ) {
    return <span>{property.textValue.toString()}</span>
  }

  if (
    property.numberValue !== null &&
    property.numberValue !== undefined
  ) {
    return <span>{property.numberValue.toString()}</span>
  }

  return <FillerCell className={fillerCellClassName} />
}

function getPropertyAccessorValue(
  property: PropertyValue | undefined,
  fieldType: FieldType
): string | number | boolean | string[] | null {
  if (!property) return null
  if (fieldType === FieldType.FieldTypeMultiSelect) {
    return property.multiSelectValues ?? null
  }
  return (
    property.textValue ??
    property.numberValue ??
    property.booleanValue ??
    property.dateValue ??
    property.dateTimeValue ??
    property.selectValue ??
    null
  )
}

function getFilterData(prop: PropertyDefinitionType) {
  const filterFn = getPropertyFilterFn(prop.fieldType)
  if (filterFn === 'tags' || filterFn === 'tags_single') {
    return {
      tags: prop.options.map((opt, idx) => ({
        label: opt,
        tag: `${prop.id}-opt-${idx}`,
      })),
    }
  }
  return undefined
}

export function createPropertyColumn<T extends RowWithProperties>(
  prop: PropertyDefinitionType,
  translation: unknown,
  fillerCellClassName: string = 'min-h-8'
): ColumnDef<T> {
  // Type-safe wrapper for translation function
  const translate = (key: string, values?: Record<string, unknown>): string => {
    const translationFn = translation as (key: string, values?: Record<string, unknown>) => string
    return translationFn(key, values)
  }
  const columnId = `property_${prop.id}`
  const filterFn = getPropertyFilterFn(prop.fieldType)
  const filterData = getFilterData(prop)

  return {
    id: columnId,
    header: prop.name,
    accessorFn: (row) => {
      const property = row.properties?.find(
        p => p.definition.id === prop.id
      )
      return getPropertyAccessorValue(property, prop.fieldType)
    },
    cell: ({ row }) => {
      const property = row.original.properties?.find(
        p => p.definition.id === prop.id
      )
      return renderPropertyCell(property, prop, translate, fillerCellClassName)
    },
    meta: {
      columnType: ColumnType.Property,
      propertyDefinitionId: prop.id,
      fieldType: prop.fieldType,
      ...(filterData && { filterData }),
    },
    minSize: 150,
    size: 200,
    maxSize: 300,
    filterFn,
  } as ColumnDef<T>
}
