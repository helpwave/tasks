import type { ChipProps } from '@helpwave/hightide'
import { Chip } from '@helpwave/hightide'
import { SavedViewEntityType } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

export type SavedViewEntityTypeChipProps = Omit<ChipProps, 'children' | 'color'> & {
  entityType: SavedViewEntityType,
}

export function SavedViewEntityTypeChip({
  entityType,
  className,
  size = 'sm',
  ...props
}: SavedViewEntityTypeChipProps) {
  const translation = useTasksTranslation()
  const isPatient = entityType === SavedViewEntityType.Patient

  return (
    <Chip
      {...props}
      size={size}
      color={isPatient ? 'primary' : 'neutral'}
      coloringStyle="tonal"
      className={clsx('font-semibold uppercase text-xs', className)}
    >
      {isPatient ? translation('viewsEntityPatient') : translation('viewsEntityTask')}
    </Chip>
  )
}
