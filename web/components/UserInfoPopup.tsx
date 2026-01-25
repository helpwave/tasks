import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, Button, LoadingContainer } from '@helpwave/hightide'
import { fetcher } from '@/api/gql/fetcher'
import clsx from 'clsx'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { SmartDate } from '@/utils/date'

const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      name
      email
      firstname
      lastname
      title
      avatarUrl
      lastOnline
      isOnline
    }
  }
`

interface UserInfo {
  id: string,
  username: string,
  name: string,
  email: string | null,
  firstname: string | null,
  lastname: string | null,
  title: string | null,
  avatarUrl: string | null,
  lastOnline: string | null,
  isOnline: boolean | null,
}

interface UserInfoPopupProps {
  userId: string | null,
  isOpen: boolean,
  onClose: () => void,
}

export const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ userId, isOpen, onClose }) => {
  const translation = useTasksTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['GetUser', userId],
    queryFn: () => fetcher<{ user: UserInfo | null }, { id: string }>(
      GET_USER_QUERY,
      { id: userId! }
    )(),
    enabled: !!userId,
  })

  const user = data?.user

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={translation('userInformation')}
      description=""
      className={clsx('w-96')}
      isModal={true}
    >
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {isLoading ? (
          <LoadingContainer />
        ) : user ? (
          <>
            <div className="flex-col-4">
              <div className="flex items-center gap-3">
                <AvatarStatusComponent
                  size="lg"
                  isOnline={user.isOnline}
                  image={user.avatarUrl ? {
                    avatarUrl: user.avatarUrl,
                    alt: user.name
                  } : undefined}
                />
                <div className="flex-col-0">
                  <div className="font-semibold text-lg">{user.name}</div>
                  {user.username && (
                    <div className="text-xs text-description">@{user.username}</div>
                  )}
                </div>
              </div>
              {user.email && (
                <div className="flex-col-1 pt-2 border-t border-divider">
                  <div className="text-xs text-description">Email</div>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {user.email}
                  </a>
                </div>
              )}
              {(user.firstname || user.lastname) && (
                <div className="flex-col-1">
                  <div className="text-xs text-description">Full Name</div>
                  <div className="text-sm">
                    {[user.firstname, user.lastname].filter(Boolean).join(' ') || 'N/A'}
                  </div>
                </div>
              )}
              <div className="flex-col-1 pt-2 border-t border-divider">
                <div className="text-xs text-description">Status</div>
                <div className="text-sm flex items-center gap-2">
                  <span className={user.isOnline ? 'text-green-500' : 'text-gray-400'}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {user.lastOnline && (
                  <div className="text-xs text-description mt-1">
                    <SmartDate date={new Date(user.lastOnline)} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-row-2 justify-end mt-4">
              <Button color="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="text-sm text-secondary">User not found</div>
        )}
      </div>
    </Dialog>
  )
}
