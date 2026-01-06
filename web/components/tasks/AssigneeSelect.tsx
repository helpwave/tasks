import { useState, useMemo, useRef, useEffect } from 'react'
import { SearchBar, Dialog } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Users, ChevronDown } from 'lucide-react'
import { useGetUsersQuery, useGetLocationsQuery } from '@/api/gql/generated'
import clsx from 'clsx'

interface AssigneeSelectProps {
  value: string,
  onValueChanged: (value: string) => void,
  allowTeams?: boolean,
  allowUnassigned?: boolean,
  excludeUserIds?: string[],
  id?: string,
  className?: string,
  onClose?: () => void,
  forceOpen?: boolean,
  dialogTitle?: string,
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
  onClose,
  forceOpen = false,
  dialogTitle,
}: AssigneeSelectProps) => {
  const translation = useTasksTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
    }
  }, [forceOpen])

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

  const filteredUsers = useMemo(() => {
    let filtered = users
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = users.filter(u => u.name.toLowerCase().includes(lowerQuery))
    }
    return [...filtered].sort((a, b) => {
      const aOnline = (a.isOnline ?? false) === true ? 1 : 0
      const bOnline = (b.isOnline ?? false) === true ? 1 : 0
      if (aOnline !== bOnline) {
        return bOnline - aOnline
      }
      return a.name.localeCompare(b.name)
    })
  }, [users, searchQuery])

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams
    const lowerQuery = searchQuery.toLowerCase()
    return teams.filter(team => team.title.toLowerCase().includes(lowerQuery))
  }, [teams, searchQuery])

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

  useEffect(() => {
    if (isOpen) {
      let attempts = 0
      const maxAttempts = 10
      const focusInput = () => {
        const input = searchInputRef.current?.querySelector('input') as HTMLInputElement | null
        if (input) {
          input.focus()
          input.select()
        } else if (attempts < maxAttempts) {
          attempts++
          requestAnimationFrame(focusInput)
        }
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(focusInput)
      })
    }
  }, [isOpen])

  const handleSelect = (selectedValue: string) => {
    onValueChanged(selectedValue)
    setIsOpen(false)
    setSearchQuery('')
    if (onClose) {
      onClose()
    }
  }

  const handleInputClick = () => {
    setIsOpen(true)
    if (selectedItem) {
      setSearchQuery(selectedItem.name)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearchQuery('')
    if (onClose) {
      onClose()
    }
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
              className="flex items-center gap-2 justify-between w-full h-10 px-3 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-on-surface hover:bg-surface-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-primary transition-all duration-200 cursor-text ml-0.5"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedItem.type === 'team' ? (
                  <Users className="size-5 text-description flex-shrink-0" />
                ) : (
                  <AvatarStatusComponent
                    size="sm"
                    fullyRounded={true}
                    isOnline={selectedItem.user.isOnline ?? null}
                    image={selectedItem.user.avatarUrl ? {
                      avatarUrl: selectedItem.user.avatarUrl,
                      alt: selectedItem.user.name
                    } : undefined}
                  />
                )}
                <span className="truncate">{selectedItem.name}</span>
              </div>
              <ChevronDown className={clsx('size-6 ml-2 flex-shrink-0 transition-transform duration-200 text-description', isOpen && 'rotate-180')} />
            </div>
          )}
        </div>
      </div>
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        titleElement={dialogTitle || translation('selectAssignee') || 'Assign to...'}
        description=""
        className="w-[500px] h-[600px] max-w-full flex flex-col"
        isModal={true}
      >
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          <div ref={searchInputRef} className="flex-shrink-0">
            <SearchBar
              placeholder={translation('searchUsersOrTeams') || 'Search users or teams...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => null}
              className="w-full"
            />
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 border border-divider rounded-lg bg-white" style={{ height: '300px' }}>
            {filteredUsers.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-description bg-white sticky top-0">{translation('users') ?? 'Users'}</div>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-2 bg-white',
                      value === u.id && 'bg-surface-selected'
                    )}
                  >
                    <AvatarStatusComponent
                      size="sm"
                      fullyRounded={true}
                      isOnline={u.isOnline ?? null}
                      image={u.avatarUrl ? {
                        avatarUrl: u.avatarUrl,
                        alt: u.name
                      } : undefined}
                    />
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
              </>
            )}
            {allowTeams && filteredTeams.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-description bg-white sticky top-0">{translation('teams')}</div>
                {filteredTeams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelect(`team:${team.id}`)}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-2 bg-white',
                      value === `team:${team.id}` && 'bg-surface-selected'
                    )}
                  >
                    <Users className="size-4 text-description flex-shrink-0" />
                    <span className="truncate">{team.title}</span>
                  </button>
                ))}
              </>
            )}
            {searchQuery.trim() && filteredUsers.length === 0 && (!allowTeams || filteredTeams.length === 0) && (
              <div className="px-3 py-2 text-sm text-description text-center bg-white">
                {translation('noResultsFound') || 'No results found'}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  )
}

