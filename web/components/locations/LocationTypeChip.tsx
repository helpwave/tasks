import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { LocationUtils } from '@/utils/location'

export interface LocationTypeChipProps {
  type: string,
}

export const LocationTypeChip = ({ type }: LocationTypeChipProps) => {
  const translation = useTasksTranslation()
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${LocationUtils.toChipColor(type)}`}>
      {translation('locationType', { type })}
    </span>
  )
}