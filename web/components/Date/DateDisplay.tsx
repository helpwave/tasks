import { Tooltip, useUpdatingDateString } from '@helpwave/hightide'
import clsx from 'clsx'

type DateDisplayProps = {
  date: Date,
  className?: string,
  showTime?: boolean,
  mode?: 'relative' | 'absolute',
}

export const DateDisplay = ({ date, className, showTime = true, mode = 'relative' }: DateDisplayProps) => {
  const { absolute, relative } = useUpdatingDateString({
    date: date ?? new Date(),
    absoluteFormat: showTime ? 'dateTime' : 'date',
  })
  if (!date) return null

  const displayString = mode === 'relative' ? relative : absolute
  const tooltipString = mode === 'relative' ? absolute : relative

  return (
    <Tooltip tooltip={tooltipString} alignment="top">
      <span className={clsx('cursor-help underline decoration-dotted decoration-neutral-300 underline-offset-2', className)}>
        {displayString}
      </span>
    </Tooltip>
  )
}
