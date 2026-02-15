import { Chip, Tooltip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { formatLocationPath, LOCATION_PATH_SEPARATOR } from '@/utils/location'
import Link from 'next/link'
import type { LocationType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { LocationTypeChip } from './LocationTypeChip'

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
        <MapPin className="size-force-3 shrink-0" />
        <span className="truncate">{displayTitle}</span>
        {linkTarget?.kind && (
          <LocationTypeChip type={linkTarget.kind} />
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
        alignment="top"
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
