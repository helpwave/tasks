import { Chip, Tooltip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { formatLocationPath, LOCATION_PATH_SEPARATOR } from '@/utils/location'
import Link from 'next/link'
import type { LocationType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

type PartialLocationNode = {
  id: string,
  title: string,
  kind?: LocationType,
  parent?: PartialLocationNode | null,
}

interface LocationChipsProps extends HTMLAttributes<HTMLDivElement> {
  locations: PartialLocationNode[],
  disableLink?: boolean,
  small?: boolean,
  placeholderProps?: HTMLAttributes<HTMLSpanElement>,
}

const getKindStyles = (kind: LocationType | undefined) => {
  if (kind === 'HOSPITAL') return 'not-print:location-hospital not-print:coloring-solid'
  if (kind === 'PRACTICE') return 'not-print:location-practice not-print:coloring-solid'
  if (kind === 'CLINIC') return 'not-print:location-clinic not-print:coloring-solid'
  if (kind === 'TEAM') return 'not-print:location-team not-print:coloring-solid'
  if (kind === 'WARD') return 'not-print:location-ward not-print:coloring-solid'
  if (kind === 'ROOM') return 'not-print:location-room not-print:coloring-solid'
  if (kind === 'BED') return 'not-print:location-bed not-print:coloring-solid'
  return ''
}

export const LocationChips = ({ locations, disableLink = false, small = false, placeholderProps, ...props }: LocationChipsProps) => {
  const translation = useTasksTranslation()

  const firstLocation = locations[0]
  const leafLocation = locations[locations.length - 1]
  if (locations.length === 0 || !firstLocation) {
    return (
      <span  {...placeholderProps} className={clsx('text-description text-sm', placeholderProps?.className)}>
        {translation('notAssigned')}
      </span>
    )
  }

  const showFullPath = locations.length > 1
  const displayTitle = showFullPath
    ? locations.map(loc => loc.title).join(LOCATION_PATH_SEPARATOR)
    : firstLocation.title
  const linkTarget = leafLocation ?? firstLocation

  const chipContent = (
    <Chip
      size="sm"
      color="neutral"
      className={clsx('cursor-pointer hover:opacity-80 transition-opacity max-w-full', small && 'text-xs')}
    >
      <div className="flex items-center gap-1 min-w-0">
        <MapPin className="size-force-3 print:hidden shrink-0" />
        <span className="truncate">{displayTitle}</span>
        {linkTarget?.kind && (
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0', getKindStyles(linkTarget.kind))}>
            {translation('locationType', { type: linkTarget.kind })}
          </span>
        )}
      </div>
    </Chip>
  )

  return (
    <div
      {...props}
      className={clsx('flex flex-wrap items-center gap-1.5', props.className)}
      onClick={(e) => {
        e.stopPropagation()
        props.onClick?.(e)
      }}
    >
      <Tooltip
        tooltip={showFullPath ? displayTitle : formatLocationPath(firstLocation)}
        position="top"
      >
        {disableLink ? (
          <div className="inline-block min-w-0 max-w-full">
            {chipContent}
          </div>
        ) : (
          <Link href={`/location/${linkTarget.id}`} className="inline-block min-w-0 max-w-full">
            {chipContent}
          </Link>
        )}
      </Tooltip>
    </div>
  )
}
