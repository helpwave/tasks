import { Button } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { DueDateUtils } from '@/utils/dueDate'

const HOUR_OFFSETS = [1, 3, 6, 12, 24]
const DAY_OFFSETS = [2, 4]

interface DueDateQuickSelectProps {
  onSelect: (dueDate: Date) => void,
}

export const DueDateQuickSelect = ({ onSelect }: DueDateQuickSelectProps) => {
  const translation = useTasksTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="xs"
          color="neutral"
          coloringStyle="outline"
          onClick={() => onSelect(DueDateUtils.dateTimeInHours(0))}
        >
          {translation('dueDateNow')}
        </Button>
        {HOUR_OFFSETS.map((hours) => (
          <Button
            key={hours}
            size="xs"
            color="neutral"
            coloringStyle="outline"
            onClick={() => onSelect(DueDateUtils.dateTimeInHours(hours))}
          >
            {translation('dueDateInHours', { hours })}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="xs"
          color="neutral"
          coloringStyle="outline"
          onClick={() => onSelect(DueDateUtils.dateOnlyInDays(0))}
        >
          {translation('dueDateToday')}
        </Button>
        <Button
          size="xs"
          color="neutral"
          coloringStyle="outline"
          onClick={() => onSelect(DueDateUtils.dateOnlyInDays(1))}
        >
          {translation('dueDateTomorrow')}
        </Button>
        {DAY_OFFSETS.map((days) => (
          <Button
            key={days}
            size="xs"
            color="neutral"
            coloringStyle="outline"
            onClick={() => onSelect(DueDateUtils.dateOnlyInDays(days))}
          >
            {translation('dueDateInDays', { days })}
          </Button>
        ))}
      </div>
    </div>
  )
}
