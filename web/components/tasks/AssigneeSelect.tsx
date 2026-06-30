import { useState, useMemo, useRef } from 'react'
import { AvatarWithStatus, PropsUtil, Visibility } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Users, ChevronDown, Info, SearchIcon } from 'lucide-react'
import { useUsers, useLocations } from '@/data'
import clsx from 'clsx'
import { AssigneeSelectDialog } from './AssigneeSelectDialog'
import { UserInfoPopup } from '../UserInfoPopup'

interface AssigneeSelectProps {
  value: string,
  onValueChanged: (value: string) => void,
  onDialogClose?: (value: string) => void,
  allowTeams?: boolean,
  allowUnassigned?: boolean,
  excludeUserIds?: string[],
  multiUserSelect?: boolean,
  onMultiUserIdsSelected?: (userIds: string[]) => void,
  id?: string,
  className?: string,
  /** Controls the height of the trigger. Use 'sm' for inline/in-table usage to keep row height compact. */
  size?: 'md' | 'sm',
  [key: string]: unknown,
}

export const  AssigneeSelect = ({
  value,
  onValueChanged,
  onDialogClose,
  allowTeams = true,
  allowUnassigned: _allowUnassigned = false,
  excludeUserIds = [],
  multiUserSelect = false,
  onMultiUserIdsSelected,
  id,
  className,
  size = 'md',
}: AssigneeSelectProps) => {
  const translation = useTasksTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserPopupState, setSelectedUserPopupState] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null })
  const closedBySelectionRef = useRef(false)


  const { data: usersData } = useUsers()
  const { data: locationsData } = useLocations()

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
    closedBySelectionRef.current = true
    onValueChanged(selectedValue)
    onDialogClose?.(selectedValue)
    setIsOpen(false)
  }

  const handleInputClick = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    if (!closedBySelectionRef.current) {
      onDialogClose?.(value)
    }
    closedBySelectionRef.current = false
    setIsOpen(false)
  }


  return (
    <>
      {/* When printing we only want the selected value, not the interactive selection UI. */}
      <span className="hidden print:inline truncate">{selectedItem?.name ?? ''}</span>
      <div
        id={id}
        className={clsx(
          'flex-row-4 justify-between items-center input-element px-2 rounded-md w-full hover:cursor-pointer print:hidden',
          size === 'sm' ? 'h-9 py-1' : 'h-12 py-2',
          className
        )}

        role="button"
        tabIndex={0}
        {...PropsUtil.aria.click(handleInputClick)}
      >
        <Visibility isVisible={!selectedItem}>
          <span className="truncate">{translation('selectAssignee')}</span>
          <SearchIcon className="size-4 text-description" />
        </Visibility>
        <Visibility isVisible={!!selectedItem}>
          {selectedItem && (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedItem.type === 'team' ? (
                  <Users className="size-5 text-description flex-shrink-0" />
                ) : (
                  <AvatarWithStatus
                    size="sm"
                    status={selectedItem.user.isOnline === undefined ? 'unknown' : selectedItem.user.isOnline ? 'online' : 'offline'}
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
                    onKeyDown={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-surface-hover rounded transition-colors text-description hover:text-on-surface"
                    aria-label="View user info"
                  >
                    <Info className="size-4" />
                  </button>
                )}
                <ChevronDown className={clsx('ml-2 flex-shrink-0 transition-transform duration-200 text-description', size === 'sm' ? 'size-5' : 'size-6', isOpen && 'rotate-180')} />
              </div>
            </>
          )}
        </Visibility>
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
        multiUserSelect={multiUserSelect}
        onMultiUserIdsSelected={onMultiUserIdsSelected}
      />
      <UserInfoPopup
        userId={selectedUserPopupState.userId}
        isOpen={selectedUserPopupState.isOpen && selectedUserPopupState.userId !== null}
        onClose={() => setSelectedUserPopupState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}

