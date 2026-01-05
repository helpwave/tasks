import React from 'react'
import { Avatar, type AvatarProps } from '@helpwave/hightide'
import { OnlineStatusIndicator } from './OnlineStatusIndicator'
import clsx from 'clsx'

interface AvatarWithStatusProps extends AvatarProps {
  isOnline?: boolean | null,
  showStatus?: boolean,
}

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  isOnline,
  showStatus = true,
  className,
  ...avatarProps
}) => {
  const size = avatarProps.size || 'md'
  const indicatorSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'
  const positionOffset = size === 'sm' ? 'bottom-0 right-0' : size === 'lg' ? 'bottom-0.5 right-0.5' : 'bottom-0 right-0'

  return (
    <div className={clsx('relative inline-flex', className)}>
      <Avatar {...avatarProps} />
      {showStatus && (
        <div className={clsx('absolute', positionOffset)}>
          <OnlineStatusIndicator isOnline={isOnline} size={indicatorSize} />
        </div>
      )}
    </div>
  )
}

