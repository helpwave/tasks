import { Chip } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type PatientScopeCountChipsProps = {
  total?: number,
  admitted?: number,
  waiting?: number,
}

export const PatientScopeCountChips = ({
  total,
  admitted,
  waiting,
}: PatientScopeCountChipsProps) => {
  const translation = useTasksTranslation()

  return (
    <div className="flex flex-wrap gap-2">
      <Chip color="neutral" coloringStyle="tonal" size="sm">
        {translation('patientsCountChipTotal', { count: String(total ?? '-') })}
      </Chip>
      <Chip color="positive" coloringStyle="tonal" size="sm">
        {translation('patientsCountChipAdmitted', { count: String(admitted ?? '-') })}
      </Chip>
      <Chip color="warning" coloringStyle="tonal" size="sm">
        {translation('patientsCountChipWaiting', { count: String(waiting ?? '-') })}
      </Chip>
    </div>
  )
}
