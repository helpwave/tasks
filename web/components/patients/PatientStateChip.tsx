import type { ChipProps } from '@helpwave/hightide'
import { Chip } from '@helpwave/hightide'
import { PatientState } from '@/api/gql/generated'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import clsx from 'clsx'

export interface PatientStateChipProps extends Omit<ChipProps, 'children' | 'color'> {
  state: PatientState,
}

export const PatientStateChip = ({ state, ...props }: PatientStateChipProps) => {
  const translation = useTasksTranslation()

  const getColor = (state: PatientState): 'positive' | 'warning' | 'neutral' | 'negative' => {
    switch (state) {
    case PatientState.Admitted:
      return 'positive'
    case PatientState.Wait:
      return 'warning'
    case PatientState.Discharged:
      return 'neutral'
    case PatientState.Dead:
      return 'negative'
    default:
      return 'neutral'
    }
  }

  return (
    <Chip
      {...props}
      color={getColor(state)}
      size={props.size ?? 'sm'}
      className={clsx('font-[var(--font-space-grotesk)] uppercase text-xs', props.className)}
    >
      {translation('patientState', { state: state as string })}
    </Chip>
  )
}

