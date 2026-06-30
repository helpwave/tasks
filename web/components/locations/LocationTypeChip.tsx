import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { LocationUtils } from '@/utils/location'
import clsx from 'clsx'

export interface LocationTypeChipProps {
  type: string,
  small?: boolean,
}

export const LocationTypeChip = ({ type, small = false }: LocationTypeChipProps) => {
  const translation = useTasksTranslation()
  return (
    <span
      className={clsx(
        `text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0`,
        LocationUtils.toChipColor(type),
        { 'truncate max-w-16': small }
      )}
    >
      {translation('locationType', { type })}
    </span>
  )
}