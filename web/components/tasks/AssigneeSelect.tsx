import { useState, useMemo } from 'react'
import { SearchBar } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Users, ChevronDown, Info } from 'lucide-react'
import { useGetUsersQuery, useGetLocationsQuery } from '@/api/gql/generated'
import clsx from 'clsx'
import { AssigneeSelectDialog } from './AssigneeSelectDialog'
import { UserInfoPopup } from '../UserInfoPopup'

interface AssigneeSelectProps {
  value: string,
  onValueChanged: (value: string) => void,
  allowTeams?: boolean,
  allowUnassigned?: boolean,
  excludeUserIds?: string[],
  id?: string,
  className?: string,
  [key: string]: unknown,
}

export const AssigneeSelect = ({
  value,
  onValueChanged,
  allowTeams = true,
  allowUnassigned: _allowUnassigned = false,
  excludeUserIds = [],
  id,
  className,
}: AssigneeSelectProps) => {
  const translation = useTasksTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserPopupState, setSelectedUserPopupState] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null })


  const { data: usersData } = useGetUsersQuery(undefined, {
  })
  const { data: locationsData } = useGetLocationsQuery(undefined, {})

  const teams = useMemo(() => {
    if (!locationsData?.locationNodes) return []
    return locationsData.locationNodes.filter(loc => loc.kind === 'TEAM')
  }, [locationsData])

  const users = useMemo(() => {
    const allUsers = usersData?.users || []
    return allUsers.filter(u => !excludeUserIds.includes(u.id))
  }, [usersData, excludeUserIds])

  const getSelectedUser = () => {
    if (!value || value === '') return null
    if (value.startsWith('team:')) {
      const teamId = value.replace('team:', '')
      const team = teams.find(t => t.id === teamId)
      return team ? { type: 'team' as const, name: team.title, id: team.id } : null
    }
    const user = users.find(u => u.id === value)
    return user ? { type: 'user' as const, name: user.name, id: user.id, user } : null
  }

  const selectedItem = getSelectedUser()

  const handleSelect = (selectedValue: string) => {
    onValueChanged(selectedValue)
    setIsOpen(false)
  }

  const handleInputClick = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const showSearchBar = !selectedItem

  return (
    <>
      <div
        id={id}
        className={clsx(
          'relative w-full',
          className
        )}
      >
        <div className="relative flex items-center w-full transition-all duration-200">
          {showSearchBar ? (
            <SearchBar
              placeholder={translation('selectAssignee') || 'Assign to...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              onSearch={() => null}
              onClick={handleInputClick}
              onFocus={handleInputClick}
              className="w-full"
            />
          ) : (
            <div
              onClick={handleInputClick}
              className="flex items-center gap-2 justify-between w-full h-10 px-3 border-2 border-border rounded-md bg-surface text-on-surface hover:bg-surface-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-primary transition-all duration-200 cursor-pointer ml-0.5"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedItem.type === 'team' ? (
                  <Users className="size-5 text-description flex-shrink-0" />
                ) : (
                  <AvatarStatusComponent
                    size="sm"
                    isOnline={selectedItem.user.isOnline ?? null}
                    image={selectedItem.user.avatarUrl ? {
                      avatarUrl: selectedItem.user.avatarUrl,
                      alt: selectedItem.user.name
                    } : undefined}
                  />
                )}
                <span className="truncate">{selectedItem?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {selectedItem && selectedItem.type === 'user' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (selectedItem) {
                        setSelectedUserPopupState({ isOpen: true, userId: selectedItem.id })
                      }
                    }}
                    className="p-1 hover:bg-surface-hover rounded transition-colors text-description hover:text-on-surface"
                    aria-label="View user info"
                  >
                    <Info className="size-4" />
                  </button>
                )}
                <ChevronDown className={clsx('size-6 ml-2 flex-shrink-0 transition-transform duration-200 text-description', isOpen && 'rotate-180')} />
              </div>
            </div>
          )}
        </div>
      </div>
      <AssigneeSelectDialog
        value={value}
        onValueChanged={handleSelect}
        allowTeams={allowTeams}
        allowUnassigned={_allowUnassigned}
        excludeUserIds={excludeUserIds}
        isOpen={isOpen}
        onClose={handleClose}
        onUserInfoClick={(userId) => setSelectedUserPopupState({ isOpen: true, userId })}
      />
      <UserInfoPopup
        userId={selectedUserPopupState.userId}
        isOpen={selectedUserPopupState.isOpen && selectedUserPopupState.userId !== null}
        onClose={() => setSelectedUserPopupState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}

