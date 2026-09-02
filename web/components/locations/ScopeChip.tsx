'use client'

import { useMemo } from 'react'
import { Chip } from '@helpwave/hightide'
import { Lock } from 'lucide-react'
import clsx from 'clsx'
import { ScopeVisibility, type LocationType } from '@/api/gql/generated'
import { LocationChips } from '@/components/locations/LocationChips'
import { useLocations } from '@/data'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export type ScopeLocation = {
  id: string,
  title: string,
  kind?: LocationType,
  parentId?: string | null,
  parent?: ScopeLocation | null,
}

type PathNode = { id: string, title: string, kind?: LocationType }

export function useScopeLocationPath(location: ScopeLocation | null | undefined): PathNode[] {
  const needsLookup = !!location && !location.parent && !!location.parentId
  const { data } = useLocations({ limit: 1000 }, { skip: !needsLookup })
  return useMemo(() => {
    if (!location) return []
    const path: PathNode[] = []
    let current: ScopeLocation | null | undefined = location
    while (current) {
      path.unshift({ id: current.id, title: current.title, kind: current.kind })
      current = current.parent ?? null
    }
    if (location.parent || !location.parentId || !data?.locationNodes) {
      return path
    }
    const byId = new Map(data.locationNodes.map(node => [node.id, node]))
    let parentId: string | null | undefined = location.parentId
    const seen = new Set<string>([location.id])
    while (parentId && !seen.has(parentId)) {
      const node = byId.get(parentId)
      if (!node) break
      seen.add(node.id)
      path.unshift({ id: node.id, title: node.title, kind: node.kind })
      parentId = node.parentId
    }
    return path
  }, [location, data?.locationNodes])
}

type ScopeLocationChipProps = {
  location: ScopeLocation,
  small?: boolean,
  className?: string,
}

export function ScopeLocationChip({ location, small = false, className }: ScopeLocationChipProps) {
  const path = useScopeLocationPath(location)
  return (
    <LocationChips
      locations={path.length > 0 ? path : [location]}
      disableLink
      small={small}
      className={className}
    />
  )
}

type ScopeChipProps = {
  visibility: ScopeVisibility,
  location?: ScopeLocation | null,
  small?: boolean,
  className?: string,
}

export function ScopeChip({ visibility, location, small = false, className }: ScopeChipProps) {
  const translation = useTasksTranslation()
  if (visibility === ScopeVisibility.Public && location) {
    return <ScopeLocationChip location={location} small={small} className={className} />
  }
  const isPublic = visibility === ScopeVisibility.Public
  return (
    <Chip
      size="sm"
      color="neutral"
      coloringStyle="tonal"
      className={clsx('inline-flex items-center gap-1 w-fit', { 'text-xs': small }, className)}
    >
      {!isPublic && <Lock className="size-force-4 shrink-0" />}
      <span>{isPublic ? translation('scopePublic') : translation('scopePrivate')}</span>
    </Chip>
  )
}
