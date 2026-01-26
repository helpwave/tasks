import type { ColumnDef } from '@tanstack/table-core'
import { ColumnType, FieldType, type PropertyDefinitionType, type PropertyValueType } from '@/api/gql/generated'
import { getPropertyFilterFn } from './propertyFilterMapping'
import { PropertyCell } from '@/components/properties/PropertyCell'

type PropertyValue = PropertyValueType & {
  definition: PropertyDefinitionType,
}

type RowWithProperties = {
  properties?: PropertyValue[] | null,
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
  if (filterFn === 'tags' || filterFn === 'tagsSingle') {
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
  prop: PropertyDefinitionType
): ColumnDef<T> {
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
      return (<PropertyCell property={property} fieldType={prop.fieldType} />)
    },
    meta: {
      columnType: ColumnType.Property,
      propertyDefinitionId: prop.id,
      fieldType: prop.fieldType,
      ...(filterData && { filterData }),
    },
    minSize: 220,
    size: 220,
    maxSize: 300,
    filterFn,
  } as ColumnDef<T>
}
