import type { LocationNodeType } from '@/api/gql/generated'

export const LOCATION_PATH_SEPARATOR = ' / '

type PartialLocationNode = {
  id: string,
  title: string,
  parent?: PartialLocationNode | null,
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
