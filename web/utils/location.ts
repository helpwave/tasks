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

export type PartialLocationNodeWithParent = {
  id: string,
  title: string,
  kind?: string,
  parent?: PartialLocationNodeWithParent | null,
}

export const buildLocationPathNodes = (location: PartialLocationNodeWithParent | LocationNodeType | null | undefined): PartialLocationNodeWithParent[] => {
  if (!location) return []

  const path: PartialLocationNodeWithParent[] = []
  let current: PartialLocationNodeWithParent | LocationNodeType | null | undefined = location as PartialLocationNodeWithParent

  while (current) {
    path.unshift({
      id: current.id,
      title: current.title,
      kind: (current as PartialLocationNodeWithParent).kind,
      parent: undefined,
    })
    current = (current as PartialLocationNodeWithParent).parent ?? null
  }

  return path
}

export const LOCATION_KIND_COLUMNS = ['CLINIC', 'WARD', 'ROOM', 'BED'] as const

export type LocationKindColumn = typeof LOCATION_KIND_COLUMNS[number]

export type LocationNodesByKind = Partial<Record<LocationKindColumn, { id: string, title: string, kind?: string }>>

const COLUMN_KINDS: Record<LocationKindColumn, readonly string[]> = {
  CLINIC: ['CLINIC', 'PRACTICE'],
  WARD: ['WARD'],
  ROOM: ['ROOM'],
  BED: ['BED'],
}

export const getLocationNodesByKind = (
  location: PartialLocationNodeWithParent | LocationNodeType | null | undefined
): LocationNodesByKind => {
  const path = buildLocationPathNodes(location)
  const out: LocationNodesByKind = {}
  for (const node of path) {
    const nodeKind = node.kind?.toUpperCase()
    if (!nodeKind) continue
    for (const col of LOCATION_KIND_COLUMNS) {
      if (out[col] !== undefined) continue
      if (COLUMN_KINDS[col].includes(nodeKind)) {
        out[col] = { id: node.id, title: node.title, kind: node.kind }
        break
      }
    }
  }
  return out
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
