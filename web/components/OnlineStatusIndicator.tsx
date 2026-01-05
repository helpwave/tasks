import React from 'react'
import clsx from 'clsx'

interface OnlineStatusIndicatorProps {
  isOnline: boolean | null | undefined,
  size?: 'sm' | 'md' | 'lg',
  className?: string,
}

export const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  isOnline,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  const borderClasses = {
    sm: 'border-[1.5px]',
    md: 'border-2',
    lg: 'border-2',
  }

  if (isOnline === null || isOnline === undefined) {
    return null
  }

  return (
    <div
      className={clsx(
        'rounded-full border-white dark:border-gray-800',
        sizeClasses[size],
        borderClasses[size],
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        className
      )}
      aria-label={isOnline ? 'Online' : 'Offline'}
    />
  )
}

