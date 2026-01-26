import { Chip } from '@helpwave/hightide'
import { PatientState } from '@/api/types'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type PatientStateChipProps = {
  state: PatientState,
}

export const PatientStateChip = ({ state }: PatientStateChipProps) => {
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
    <Chip color={getColor(state)} size="sm" className="font-[var(--font-space-grotesk)] uppercase text-xs">
      {translation('patientState', { state: state as string })}
    </Chip>
  )
}

