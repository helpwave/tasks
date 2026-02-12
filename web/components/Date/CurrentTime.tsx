import { Tooltip, useUpdatingDateString } from '@helpwave/hightide'
import clsx from 'clsx'
import { useState } from 'react'

type CurrentTimeProps = {
    className?: string,
    showDate?: boolean,
  }

export const CurrentTime = ({ className, showDate = false }: CurrentTimeProps) => {
  const [now] = useState(new Date())
  const { absolute } = useUpdatingDateString({
    date: now,
    absoluteFormat: showDate ? 'dateTime' : 'time',
  })

  return (
    <Tooltip tooltip={absolute} alignment="top">
      <span className={clsx('tabular-nums cursor-default', className)}>
        {absolute}
      </span>
    </Tooltip>
  )
}