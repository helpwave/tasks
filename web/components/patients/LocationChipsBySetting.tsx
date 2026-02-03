import { LocationChips } from '@/components/patients/LocationChips'
import type { LocationType } from '@/api/gql/generated'
import type { HTMLAttributes } from 'react'

type PartialLocationNode = {
  id: string,
  title: string,
  kind?: LocationType | string,
  parent?: PartialLocationNode | null,
}

type LocationChipsBySettingProps = HTMLAttributes<HTMLDivElement> & {
  locations: PartialLocationNode[],
  disableLink?: boolean,
  small?: boolean,
  placeholderProps?: HTMLAttributes<HTMLSpanElement>,
}

type LocationChipsLocations = Parameters<typeof LocationChips>[0]['locations']

export const LocationChipsBySetting = ({
  locations,
  disableLink,
  small,
  placeholderProps,
  ...props
}: LocationChipsBySettingProps) => {
  const locationsToShow: LocationChipsLocations = (() => {
    if (locations.length === 0) return []
    const leaf = locations[locations.length - 1]
    if (!leaf) return []
    return [leaf] as LocationChipsLocations
  })()

  return (
    <LocationChips
      locations={locationsToShow}
      disableLink={disableLink}
      small={small}
      placeholderProps={placeholderProps}
      {...props}
    />
  )
}
