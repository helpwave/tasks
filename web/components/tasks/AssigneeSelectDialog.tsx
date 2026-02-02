import { useState, useMemo, useRef, useEffect } from 'react'
import { SearchBar, Dialog } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Users, Info } from 'lucide-react'
import { useUsers, useLocations } from '@/data'
import clsx from 'clsx'

interface AssigneeSelectDialogProps {
  value: string,
  onValueChanged: (value: string) => void,
  allowTeams?: boolean,
  allowUnassigned?: boolean,
  excludeUserIds?: string[],
  isOpen: boolean,
  onClose: () => void,
  dialogTitle?: string,
  onUserInfoClick?: (userId: string) => void,
}

export const AssigneeSelectDialog = ({
  value,
  onValueChanged,
  allowTeams = true,
  allowUnassigned: _allowUnassigned = false,
  excludeUserIds = [],
  isOpen,
  onClose,
  dialogTitle,
  onUserInfoClick,
}: AssigneeSelectDialogProps) => {
  const translation = useTasksTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLDivElement>(null)

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
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleSelect = (selectedValue: string) => {
    onValueChanged(selectedValue)
    setSearchQuery('')
    onClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      titleElement={dialogTitle || translation('selectAssignee') || 'Assign to...'}
      description=""
      className="w-[500px] h-[600px] max-w-full flex flex-col"
      isModal={true}
    >
      <div ref={searchInputRef} className="flex-shrink-0">
        <SearchBar
          placeholder={translation('searchUsersOrTeams') || 'Search users or teams...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={() => null}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto flex-1 min-h-0 border border-divider rounded-lg bg-surface" style={{ height: '300px' }}>
          {filteredUsers.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-description bg-surface sticky top-0">{translation('users') ?? 'Users'}</div>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className={clsx(
                    'w-full px-3 py-2 hover:bg-surface-hover transition-colors flex items-center gap-2 bg-surface',
                    value === u.id && 'bg-surface-selected'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <AvatarStatusComponent
                      size="sm"
                      isOnline={u.isOnline ?? null}
                      image={u.avatarUrl ? {
                        avatarUrl: u.avatarUrl,
                        alt: u.name
                      } : undefined}
                    />
                    <span className="truncate">{u.name}</span>
                  </button>
                  {onUserInfoClick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUserInfoClick(u.id)
                      }}
                      className="p-1 hover:bg-surface-hover rounded transition-colors text-description hover:text-on-surface flex-shrink-0"
                      aria-label="View user info"
                    >
                      <Info className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
          {allowTeams && filteredTeams.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-description bg-surface sticky top-0">{translation('teams')}</div>
              {filteredTeams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleSelect(`team:${team.id}`)}
                  className={clsx(
                    'w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-2 bg-surface',
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
            <div className="px-3 py-2 text-sm text-description text-center bg-surface">
              {translation('noResultsFound') || 'No results found'}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

