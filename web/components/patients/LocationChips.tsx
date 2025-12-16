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
  maxVisible?: number,
}

export const LocationChips = ({ locations, maxVisible = 3 }: LocationChipsProps) => {
  if (locations.length === 0) {
    return (
      <span className="text-description text-sm">
        Not assigned
      </span>
    )
  }

  const visibleLocations = locations.slice(0, maxVisible)
  const remainingCount = locations.length - maxVisible

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleLocations.map((location) => {
        const fullPath = formatLocationPath(location)

        return (
          <Tooltip
            key={location.id}
            tooltip={fullPath}
            position="top"
          >
            <Chip
              size="small"
              color="neutral"
              className="cursor-help"
            >
              <div className="flex items-center gap-1">
                <MapPin className="size-3" />
                <span>{location.title}</span>
              </div>
            </Chip>
          </Tooltip>
        )
      })}
      {remainingCount > 0 && (
        <Tooltip
          tooltip={locations.slice(maxVisible).map(loc => formatLocationPath(loc)).join('\n')}
          position="top"
        >
          <Chip
            size="small"
            color="neutral"
            className="cursor-help"
          >
            +{remainingCount}
          </Chip>
        </Tooltip>
      )}
    </div>
  )
}
