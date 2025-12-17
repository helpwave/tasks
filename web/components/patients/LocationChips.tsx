import { Chip, Tooltip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { formatLocationPath } from '@/utils/location'
import Link from 'next/link'
import type { LocationType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type PartialLocationNode = {
  id: string,
  title: string,
  kind?: LocationType,
  parent?: PartialLocationNode | null,
}

interface LocationChipsProps {
  locations: PartialLocationNode[],
}

const getKindStyles = (kind: string | undefined) => {
  if (!kind) return 'bg-surface-subdued text-text-tertiary'
  const k = kind.toUpperCase()
  if (k.includes('CLINIC')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (k.includes('WARD')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (k.includes('TEAM')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (k.includes('ROOM')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  if (k.includes('BED')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return 'bg-surface-subdued text-text-tertiary'
}

export const LocationChips = ({ locations }: LocationChipsProps) => {
  const translation = useTasksTranslation()

  if (locations.length === 0) {
    return (
      <span className="text-description text-sm">
        Not assigned
      </span>
    )
  }

  const firstLocation = locations[0]
  const remainingCount = locations.length - 1
  const remainingLocations = locations.slice(1)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tooltip
        tooltip={formatLocationPath(firstLocation)}
        position="top"
      >
        <Link href={`/location/${firstLocation.id}`} className="inline-block">
          <Chip
            size="small"
            color="neutral"
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <MapPin className="size-3" />
              <span>{firstLocation?.title}</span>
              {firstLocation?.kind && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getKindStyles(firstLocation.kind)}`}>
                  {translation('locationType', { type: firstLocation.kind })}
                </span>
              )}
            </div>
          </Chip>
        </Link>
      </Tooltip>
      {remainingCount > 0 && (
        <Tooltip
          tooltip={remainingLocations.map(loc => formatLocationPath(loc)).join('\n')}
          position="top"
        >
          <Chip
            size="small"
            color="neutral"
            className="cursor-help whitespace-pre-line"
          >
            +{remainingCount}
          </Chip>
        </Tooltip>
      )}
    </div>
  )
}
