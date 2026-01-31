import { LocationType } from '@/api/gql/generated'
import type { LocationNodeType } from '@/api/gql/generated'

export const LOCATION_PATH_SEPARATOR = ' / '

type PartialLocationNode = {
  id: string,
  title: string,
  parent?: PartialLocationNode | null,
}

type LocationNodeWithKind = PartialLocationNode & { kind?: LocationType }

export type LocationDisplayParts = {
  mainText: string,
  pillContent: string | null,
  pillKind: LocationType | null,
}

export const buildLocationPath = (location: PartialLocationNode | LocationNodeType | null | undefined): string[] => {
  if (!location) return []

  const path: string[] = []
  let current: PartialLocationNode | LocationNodeType | null | undefined = location

  while (current) {
    path.unshift(current.title)
    current = current.parent || null
  }

  return path
}

export const formatLocationPath = (location: PartialLocationNode | LocationNodeType | null | undefined, separator: string = LOCATION_PATH_SEPARATOR): string => {
  return buildLocationPath(location).join(separator)
}

export const getLocationDisplayParts = (location: LocationNodeWithKind | LocationNodeType | null | undefined): LocationDisplayParts => {
  if (!location) return { mainText: '', pillContent: null, pillKind: null }
  const fullPath = formatLocationPath(location)
  const kind = 'kind' in location ? location.kind : undefined
  if (kind === LocationType.Bed && location.parent?.parent) {
    return {
      mainText: [location.parent.parent.title, location.parent.title].join(LOCATION_PATH_SEPARATOR),
      pillContent: location.title,
      pillKind: LocationType.Bed,
    }
  }
  if (kind === LocationType.Bed && location.parent) {
    return {
      mainText: location.parent.title,
      pillContent: location.title,
      pillKind: LocationType.Bed,
    }
  }
  return { mainText: fullPath, pillContent: null, pillKind: kind ?? null }
}

export const buildLocationPathFromId = (
  locationId: string | null | undefined,
  allLocations: Map<string, { id: string, title: string, parentId?: string | null }>
): string[] => {
  if (!locationId) return []

  const path: string[] = []
  let currentId: string | null | undefined = locationId

  while (currentId) {
    const location = allLocations.get(currentId)
    if (!location) break

    path.unshift(location.title)
    currentId = location.parentId || null
  }

  return path
}

export const formatLocationPathFromId = (
  locationId: string | null | undefined,
  allLocations: Map<string, { id: string, title: string, parentId?: string | null }>,
  separator: string = LOCATION_PATH_SEPARATOR
): string => {
  return buildLocationPathFromId(locationId, allLocations).join(separator)
}
