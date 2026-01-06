import { useState, useMemo, useRef, useEffect } from 'react'
import { SearchBar } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Users, ChevronDown } from 'lucide-react'
import { useGetUsersQuery, useGetLocationsQuery } from '@/api/gql/generated'
import clsx from 'clsx'
import { createPortal } from 'react-dom'

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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLDivElement>(null)
  const searchInputId = useMemo(() => id ? `${id}-search` : `assignee-select-search-${Math.random().toString(36).substr(2, 9)}`, [id])

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

  const getDisplayValue = () => {
    if (!value || value === '') {
      return 'Choose user or team'
    }
    if (value.startsWith('team:')) {
      const teamId = value.replace('team:', '')
      const team = teams.find(t => t.id === teamId)
      return team?.title || value
    }
    const user = users.find(u => u.id === value)
    return user?.name || value
  }

  const getDisplayAvatar = () => {
    if (!value) return null
    if (value.startsWith('team:')) {
      return <Users className="size-5 text-description flex-shrink-0" />
    }
    const user = users.find(u => u.id === value)
    if (!user) return null
    return (
      <AvatarStatusComponent
        size="sm"
        fullyRounded={true}
        isOnline={user.isOnline ?? null}
        image={user.avatarUrl ? {
          avatarUrl: user.avatarUrl,
          alt: user.name
        } : undefined}
      />
    )
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
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
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleSelect = (selectedValue: string) => {
    onValueChanged(selectedValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const triggerRect = triggerRef.current?.getBoundingClientRect()

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 justify-between w-full h-10 px-3 text-left border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-on-surface hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors overflow-hidden ml-0.5',
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getDisplayAvatar()}
          <span className="truncate">{getDisplayValue()}</span>
        </div>
        <ChevronDown className={clsx('size-6 ml-2 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && triggerRect && createPortal(
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[10000] mt-1 bg-white dark:bg-gray-800 border border-divider rounded-md shadow-lg min-w-[200px] max-w-[400px] max-h-[400px] flex flex-col"
          style={{
            top: triggerRect.bottom + 4,
            left: triggerRect.left,
            width: triggerRect.width,
          }}
        >
          <div className="p-2 border-b border-divider sticky top-0 bg-white dark:bg-gray-800 z-[10000]">
            <div ref={searchInputRef} className="relative z-[10000]">
              <SearchBar
                id={searchInputId}
                name={searchInputId}
                placeholder={translation('searchLocations')?.replace('locations', '')?.trim() || 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={() => null}
                className="w-full"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 bg-white dark:bg-gray-800">
            {filteredUsers.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-description bg-white dark:bg-gray-800">{translation('users') ?? 'Users'}</div>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(u.id)
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-2 bg-white dark:bg-gray-800',
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
                <div className="px-2 py-1 text-xs font-semibold text-description bg-white dark:bg-gray-800">{translation('teams')}</div>
                {filteredTeams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(`team:${team.id}`)
                    }}
                    className={clsx(
                      'w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-2 bg-white dark:bg-gray-800',
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
              <div className="px-3 py-2 text-sm text-description text-center">
                No results found
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
