import type { LocationType } from '@/api/gql/generated'
import { LocationChips } from '@/components/locations/LocationChips'
import { Avatar } from '@helpwave/hightide'
import clsx from 'clsx'

export type FilterPreviewLocationItem = {
  id: string,
  title: string,
  kind?: LocationType,
}

export function FilterPreviewAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string,
  avatarUrl?: string | null,
  className?: string,
}) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 origin-center scale-[0.82] rounded-full ring-1 ring-border/50 overflow-hidden align-middle',
        className
      )}
    >
      <Avatar
        size="xs"
        image={avatarUrl ? { avatarUrl, alt: name } : undefined}
      />
    </span>
  )
}

export function FilterPreviewLocationChips({
  locations,
  className,
}: {
  locations: FilterPreviewLocationItem[],
  className?: string,
}) {
  return (
    <span className={clsx('inline-flex min-w-0 max-w-full origin-left scale-[0.82]', className)}>
      <LocationChips locations={locations} small disableLink className="max-w-full" />
    </span>
  )
}
