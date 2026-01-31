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

type LocationWithKindAndParent = {
  id: string,
  title: string,
  kind?: string,
  parent?: LocationWithKindAndParent | null,
}

export type PatientWithPositionAndLocations = {
  position?: LocationWithKindAndParent | null,
  assignedLocations?: LocationWithKindAndParent[],
}

const findRoomUnderWardInChain = (node: LocationWithKindAndParent | null | undefined, wardId: string): { id: string, title: string } | null => {
  let current: LocationWithKindAndParent | null | undefined = node
  while (current) {
    if (current.parent?.id === wardId) {
      return { id: current.id, title: current.title }
    }
    current = current.parent ?? null
  }
  return null
}

export const getRoomUnderWard = (
  patient: PatientWithPositionAndLocations,
  wardId: string
): { id: string, title: string } | null => {
  const fromPosition = findRoomUnderWardInChain(patient.position ?? null, wardId)
  if (fromPosition) return fromPosition
  const locations = patient.assignedLocations ?? []
  for (const loc of locations) {
    const found = findRoomUnderWardInChain(loc, wardId)
    if (found) return found
  }
  return null
}
