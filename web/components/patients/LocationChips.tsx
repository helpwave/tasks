import { Chip, Tooltip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { formatLocationPath } from '@/utils/location'
import Link from 'next/link'
import { LocationType } from '@/api/types'
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
  if (locations.length === 0 || !firstLocation) {
    return (
      <span  {...placeholderProps} className={clsx('text-description text-sm', placeholderProps?.className)}>
        {translation('notAssigned')}
      </span>
    )
  }

  const remainingCount = locations.length - 1
  const remainingLocations = locations.slice(1)

  const chipContent = (
    <Chip
      size="sm"
      color="neutral"
      className={`cursor-pointer hover:opacity-80 transition-opacity ${small ? 'text-xs' : ''}`}
    >
      <div className="flex items-center gap-1">
        <MapPin className="size-force-3 print:hidden" />
        <span>{firstLocation?.title}</span>
        {firstLocation?.kind && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getKindStyles(firstLocation.kind)}`}>
            {translation('locationType', { type: firstLocation.kind })}
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
        tooltip={formatLocationPath(firstLocation)}
        position="top"
      >
        {disableLink ? (
          <div className="inline-block">
            {chipContent}
          </div>
        ) : (
          <Link href={`/location/${firstLocation.id}`} className="inline-block">
            {chipContent}
          </Link>
        )}
      </Tooltip>
      {remainingCount > 0 && (
        <Tooltip
          tooltip={remainingLocations.map(loc => formatLocationPath(loc)).join('\n')}
          position="top"
        >
          <Chip
            size="sm"
            color="neutral"
            className={`cursor-help whitespace-pre-line ${small ? 'text-xs' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            +{remainingCount}
          </Chip>
        </Tooltip>
      )}
    </div>
  )
}
