import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, Button, LoadingContainer } from '@helpwave/hightide'
import { fetcher } from '@/api/gql/fetcher'
import clsx from 'clsx'
import Image from 'next/image'

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
}

interface UserInfoPopupProps {
  userId: string | null,
  isOpen: boolean,
  onClose: () => void,
}

export const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ userId, isOpen, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['GetUser', userId],
    queryFn: () => fetcher<{ user: UserInfo | null }, { id: string }>(
      GET_USER_QUERY,
      { id: userId! }
    )(),
    enabled: isOpen && !!userId,
  })

  const user = data?.user

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement="User Information"
      description=""
      className={clsx('w-96')}
    >
      {isLoading ? (
        <LoadingContainer />
      ) : user ? (
        <div className="flex-col-4">
          {user.avatarUrl && (
            <div className="flex justify-center">
              <Image
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          )}
          <div className="flex-col-2">
            <div className="font-semibold text-lg">{user.name}</div>
            {user.title && (
              <div className="text-sm text-secondary">{user.title}</div>
            )}
            {user.username && (
              <div className="text-xs text-description">@{user.username}</div>
            )}
          </div>
          {user.email && (
            <div className="flex-col-1 pt-2 border-t border-divider">
              <div className="text-xs text-description">Email</div>
              <div className="text-sm">{user.email}</div>
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
        </div>
      ) : (
        <div className="text-sm text-secondary">User not found</div>
      )}
      <div className="flex-row-2 justify-end mt-4">
        <Button color="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  )
}
