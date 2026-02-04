import type { ColumnDef } from '@tanstack/table-core'
import { ColumnType, FieldType, type LocationType, type PropertyDefinitionType, type PropertyValueType, type PropertyEntity } from '@/api/gql/generated'
import { getPropertyFilterFn } from './propertyFilterMapping'
import { PropertyCell } from '@/components/properties/PropertyCell'

export type PropertyValueRow = Pick<PropertyValueType, 'textValue' | 'numberValue' | 'booleanValue' | 'dateValue' | 'dateTimeValue' | 'selectValue' | 'multiSelectValues' | 'userValue'> & {
  definition: PropertyDefinitionType,
  user?: { id: string, name: string, avatarUrl?: string | null, isOnline?: boolean } | null,
  team?: { id: string, title: string, kind: LocationType } | null,
}

type RowWithProperties = {
  properties?: PropertyValueRow[] | null,
}

function getPropertyAccessorValue(
  property: PropertyValueRow | undefined,
  fieldType: FieldType
): string | number | boolean | string[] | null {
  if (!property) return null
  if (fieldType === FieldType.FieldTypeMultiSelect) {
    return property.multiSelectValues ?? null
  }
  if (fieldType === FieldType.FieldTypeUser) {
    return property.userValue ?? null
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
      return (<PropertyCell property={property as PropertyValueType} fieldType={prop.fieldType} />)
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

type PropertyDefinitionsData = {
  propertyDefinitions?: PropertyDefinitionType[],
} | null | undefined

export function getPropertyColumnsForEntity<T extends RowWithProperties>(
  propertyDefinitionsData: PropertyDefinitionsData,
  entity: PropertyEntity
): ColumnDef<T>[] {
  if (!propertyDefinitionsData?.propertyDefinitions) return []
  const properties = propertyDefinitionsData.propertyDefinitions.filter(
    def => def.isActive && def.allowedEntities.includes(entity)
  )
  return properties.map(prop => createPropertyColumn<T>(prop))
}
