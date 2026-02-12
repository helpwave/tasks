import { Chip, ProgressIndicator, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Sex } from '@/api/gql/generated'
import type { PatientViewModel } from '../tables/PatientList'

type PatientCardViewProps = {
  patient: PatientViewModel,
  onClick: (patient: PatientViewModel) => void,
}

export const PatientCardView = ({ patient, onClick }: PatientCardViewProps) => {
  const translation = useTasksTranslation()

  const sex = patient.sex
  const colorClass = sex === Sex.Male
    ? '!gender-male'
    : sex === Sex.Female
      ? '!gender-female'
      : 'bg-gray-600 text-white'

  const label = {
    [Sex.Male]: translation('male'),
    [Sex.Female]: translation('female'),
    [Sex.Unknown]: translation('diverse'),
  }[sex] || sex

  const { openTasksCount, closedTasksCount } = patient
  const total = openTasksCount + closedTasksCount
  const progress = total === 0 ? 0 : closedTasksCount / total
  const tooltipText = `${translation('openTasks')}: ${openTasksCount}\n${translation('closedTasks')}: ${closedTasksCount}`

  return (
    <button
      onClick={() => onClick(patient)}
      className="border-2 p-5 rounded-lg text-left w-full transition-colors hover:border-primary relative bg-[rgba(255,255,255,1)] dark:bg-[rgba(55,65,81,1)]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg flex-1">{patient.name}</h3>
          {total > 0 && (
            <Tooltip
              tooltip={tooltipText}
              alignment="top"
              tooltipClassName="whitespace-pre-line"
            >
              <div className="shrink-0">
                <ProgressIndicator progress={progress} rotation={-90} />
              </div>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-description">
          <span className="font-medium">{translation('birthdate')}:</span>
          <SmartDate date={patient.birthdate} showTime={false} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            color={sex === Sex.Unknown ? 'neutral' : undefined}
            size="sm"
            className={`${colorClass} font-[var(--font-space-grotesk)] uppercase text-xs`}
          >
            <span>{label}</span>
          </Chip>
          {patient.position && (
            <LocationChipsBySetting locations={[patient.position]} small />
          )}
          <PatientStateChip state={patient.state} />
        </div>
      </div>
    </button>
  )
}

