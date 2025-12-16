import type { LocationNodeType } from '@/api/gql/generated'

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

export const formatLocationPath = (location: PartialLocationNode | LocationNodeType | null | undefined, separator: string = ' > '): string => {
  return buildLocationPath(location).join(separator)
}
