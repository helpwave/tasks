import React from 'react'
import type { AvatarSize } from '@helpwave/hightide'
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
  const size = avatarProps.size || 'sm'
  const dotSizeClasses: Record<NonNullable<AvatarSize>, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const dotPositionClasses: Record<NonNullable<AvatarSize>, string> = {
    xs: 'bottom-0 right-0',
    sm: 'bottom-0 right-0',
    md: 'bottom-0 right-0',
    lg: 'bottom-0 right-0',
  }

  const dotBorderClasses: Record<NonNullable<AvatarSize>, string> = {
    xs: 'border-[1.5px]',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-2',
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
          showOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
        aria-label={showOnline ? 'Online' : 'Offline'}
      />
    </div>
  )
}

