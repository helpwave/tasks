import React from 'react'
import { Avatar, type AvatarProps } from '@helpwave/hightide'
import clsx from 'clsx'

interface AvatarStatusComponentProps extends AvatarProps {
  isOnline?: boolean | null,
}

export const AvatarStatusComponent: React.FC<AvatarStatusComponentProps> = ({
  isOnline,
  className,
  ...avatarProps
}) => {
  const size = avatarProps.size || 'md'
  const dotSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }

  const dotPositionClasses = {
    sm: 'bottom-0 right-0',
    md: 'bottom-0 right-0',
    lg: 'bottom-0 right-0',
    xl: 'bottom-0 right-0',
  }

  const dotBorderClasses = {
    sm: 'border-[1.5px]',
    md: 'border-2',
    lg: 'border-2',
    xl: 'border-2',
  }

  const showOnline = isOnline === true

  return (
    <div className={clsx('relative inline-flex', className)}>
      <Avatar {...avatarProps} />
      <div
        className={clsx(
          'absolute rounded-full border-white dark:border-gray-800',
          dotSizeClasses[size],
          dotPositionClasses[size],
          dotBorderClasses[size],
          showOnline ? 'bg-green-600' : 'bg-red-600'
        )}
        aria-label={showOnline ? 'Online' : 'Offline'}
      />
    </div>
  )
}

