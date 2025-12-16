import { Chip, Tooltip } from '@helpwave/hightide'
import { MapPin } from 'lucide-react'
import { formatLocationPath } from '@/utils/location'

type PartialLocationNode = {
  id: string,
  title: string,
  parent?: PartialLocationNode | null,
}

interface LocationChipsProps {
  locations: PartialLocationNode[],
}

export const LocationChips = ({ locations }: LocationChipsProps) => {
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
        <Chip
          size="small"
          color="neutral"
          className="cursor-help"
        >
          <div className="flex items-center gap-1">
            <MapPin className="size-3" />
            <span>{firstLocation?.title}</span>
          </div>
        </Chip>
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
