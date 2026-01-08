import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SmartDate } from '@/utils/date'
import clsx from 'clsx'
import { fetcher } from '@/api/gql/fetcher'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { HelpwaveLogo } from '@helpwave/hightide'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { ChevronRight } from 'lucide-react'

const GET_AUDIT_LOGS_QUERY = `
  query GetAuditLogs($caseId: ID!, $limit: Int, $offset: Int) {
    auditLogs(caseId: $caseId, limit: $limit, offset: $offset) {
      caseId
      activity
      userId
      timestamp
      context
    }
  }
`

export interface AuditLogEntry {
  caseId: string,
  activity: string,
  userId: string | null,
  timestamp: string,
  context: string | null,
}

interface AuditLogTimelineProps {
  caseId: string,
  className?: string,
  enabled?: boolean,
}

const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      name
      avatarUrl
      isOnline
    }
  }
`

interface UserInfo {
  id: string,
  username: string,
  name: string,
  avatarUrl: string | null,
  isOnline: boolean | null,
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ caseId, className, enabled = false }) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set())
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [shouldFetch, setShouldFetch] = useState(false)

  useEffect(() => {
    if (enabled && !shouldFetch) {
      setShouldFetch(true)
    }
  }, [enabled, shouldFetch])

  const { data, isLoading } = useQuery({
    queryKey: ['GetAuditLogs', caseId],
    queryFn: () => fetcher<{ auditLogs: AuditLogEntry[] }, { caseId: string }>(
      GET_AUDIT_LOGS_QUERY,
      { caseId }
    )(),
    enabled: !!caseId && shouldFetch,
  })

  const auditLogs = useMemo(() => data?.auditLogs || [], [data?.auditLogs])

  const uniqueUserIds = useMemo(() => {
    return Array.from(new Set(auditLogs.map(log => log.userId).filter(Boolean) as string[]))
  }, [auditLogs])

  const usersQuery = useQuery({
    queryKey: ['GetUsers', uniqueUserIds],
    queryFn: async () => {
      const validUserIds = uniqueUserIds.filter((id): id is string => !!id)
      const userPromises = validUserIds.map(userId =>
        fetcher<{ user: UserInfo | null }, { id: string }>(
          GET_USER_QUERY,
          { id: userId }
        )())
      const results = await Promise.all(userPromises)
      const userMap = new Map<string, UserInfo>()
      results.forEach((result, index) => {
        if (result.user && validUserIds[index]) {
          userMap.set(validUserIds[index], result.user)
        }
      })
      return userMap
    },
    enabled: uniqueUserIds.length > 0,
  })

  const getUserName = (userId: string | null): string => {
    if (!userId) return 'Unknown User'
    const user = usersQuery.data?.get(userId)
    return user?.name || user?.username || userId
  }

  const getUserInfo = (userId: string | null): UserInfo | null => {
    if (!userId) return null
    return usersQuery.data?.get(userId) || null
  }

  const toggleExpand = (index: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const formatActivity = (activity: string): string => {
    return activity
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const hasContext = (entry: AuditLogEntry): boolean => {
    if (!entry.context) return false
    try {
      const parsed = JSON.parse(entry.context)
      return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0
    } catch {
      return entry.context.length > 0
    }
  }

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const entry = auditLogs[index]
    if (entry && hasContext(entry)) {
      toggleExpand(index)
    }
  }

  return (
    <div className={clsx('flex-col-2', className)}>
      <div className="text-sm font-semibold mb-4">
        Audit Log
      </div>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <HelpwaveLogo className="w-16 h-16" animate="loading" />
        </div>
      )}
      {!isLoading && (
        <div className="flex-col-3">
          {auditLogs.map((entry: AuditLogEntry, index: number) => {
            const userInfo = getUserInfo(entry.userId)
            const isExpanded = expandedEntries.has(index)
            const hasDetails = hasContext(entry)

            return (
              <div
                key={index}
                onClick={(e) => handleCardClick(index, e)}
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all',
                  'bg-[rgba(255,255,255,1)] dark:bg-[rgba(55,65,81,1)]',
                  'border-gray-300 dark:border-gray-600',
                  'hover:border-primary hover:shadow-md',
                  hasDetails && 'cursor-pointer'
                )}
              >
                <div className="flex-row-2 justify-between items-start gap-4">
                  <div className="flex-col-2 flex-grow min-w-0">
                    <div className="font-medium text-sm mb-2">
                      {formatActivity(entry.activity)}
                    </div>
                    <div className="flex-row-2 items-center gap-2">
                      {entry.userId && userInfo && (
                        <>
                          <AvatarStatusComponent
                            size="sm"
                            fullyRounded={true}
                            isOnline={userInfo.isOnline}
                            image={userInfo.avatarUrl ? {
                              avatarUrl: userInfo.avatarUrl,
                              alt: userInfo.name
                            } : undefined}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUserId(entry.userId)
                            }}
                            className="text-xs text-gray-600 dark:text-gray-400 text-left hover:opacity-75 transition-opacity"
                          >
                            {getUserName(entry.userId)}
                          </button>
                        </>
                      )}
                      {entry.userId && !userInfo && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {getUserName(entry.userId)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <SmartDate date={new Date(entry.timestamp)} />
                    </div>
                  </div>
                  {hasDetails && (
                    <div className="flex items-center shrink-0">
                      <ChevronRight
                        className={clsx(
                          'w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </div>
                  )}
                </div>
                {isExpanded && entry.context && (() => {
                  try {
                    const parsed = JSON.parse(entry.context)
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(parsed, null, 2)}</pre>
                        </div>
                      </div>
                    )
                  } catch {
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                          <pre>{entry.context}</pre>
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
            )
          })}
          {auditLogs.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 italic py-8 text-center">
              No audit logs available
            </div>
          )}
        </div>
      )}
      <UserInfoPopup
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  )
}

