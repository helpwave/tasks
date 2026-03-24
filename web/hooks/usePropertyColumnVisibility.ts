import { useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import type { PropertyEntity } from '@/api/gql/generated'
import { normalizedVisibilityForViewCompare } from '@/utils/viewDefinition'

type PropertyDefinitionsData = {
  propertyDefinitions?: Array<{
    id: string,
    isActive: boolean,
    allowedEntities: string[],
  }>,
} | null | undefined

export function getPropertyColumnIds(
  propertyDefinitionsData: PropertyDefinitionsData,
  entity: PropertyEntity
): string[] {
  if (!propertyDefinitionsData?.propertyDefinitions) return []
  const entityValue = entity as string
  return propertyDefinitionsData.propertyDefinitions
    .filter(def => def.isActive && def.allowedEntities.includes(entityValue))
    .map(prop => `property_${prop.id}`)
}

export function useColumnVisibilityWithPropertyDefaults(
  propertyDefinitionsData: PropertyDefinitionsData,
  entity: PropertyEntity,
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>
): Dispatch<SetStateAction<VisibilityState>> {
  const propertyColumnIds = useMemo(
    () => getPropertyColumnIds(propertyDefinitionsData, entity),
    [propertyDefinitionsData, entity]
  )

  return useCallback(
    (updater: SetStateAction<VisibilityState>) => {
      setColumnVisibility(prev => {
        const next = typeof updater === 'function'
          ? (updater as (p: VisibilityState) => VisibilityState)(prev)
          : updater
        if (propertyColumnIds.length === 0) {
          return normalizedVisibilityForViewCompare(next) === normalizedVisibilityForViewCompare(prev)
            ? prev
            : next
        }
        const merged: VisibilityState = { ...next }
        for (const id of propertyColumnIds) {
          if (!(id in merged)) {
            merged[id] = false
          }
        }
        return normalizedVisibilityForViewCompare(merged) === normalizedVisibilityForViewCompare(prev)
          ? prev
          : merged
      })
    },
    [propertyColumnIds, setColumnVisibility]
  )
}
