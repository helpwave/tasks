import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import type { PropertyEntity } from '@/api/gql/generated'

type PropertyDefinitionsData = {
  propertyDefinitions?: Array<{
    id: string,
    isActive: boolean,
    allowedEntities: string[],
  }>,
} | null | undefined

export function usePropertyColumnVisibility(
  propertyDefinitionsData: PropertyDefinitionsData,
  entity: PropertyEntity,
  columnVisibility: VisibilityState,
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>
): void {
  useEffect(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return

    const entityValue = entity as string
    const properties = propertyDefinitionsData.propertyDefinitions.filter(
      def => def.isActive && def.allowedEntities.includes(entityValue)
    )
    const propertyColumnIds = properties.map(prop => `property_${prop.id}`)
    const hasPropertyColumnsInVisibility = propertyColumnIds.some(
      id => id in columnVisibility
    )

    if (!hasPropertyColumnsInVisibility && propertyColumnIds.length > 0) {
      const initialVisibility: VisibilityState = { ...columnVisibility }
      propertyColumnIds.forEach(id => {
        initialVisibility[id] = false
      })
      setColumnVisibility(initialVisibility)
    }
  }, [propertyDefinitionsData, entity, columnVisibility, setColumnVisibility])
}
