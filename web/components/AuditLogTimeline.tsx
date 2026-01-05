import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SmartDate } from '@/utils/date'
import clsx from 'clsx'
import { fetcher } from '@/api/gql/fetcher'
import { UserInfoPopup } from '@/components/UserInfoPopup'

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
}

const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      name
    }
  }
`

interface UserInfo {
  id: string,
  username: string,
  name: string,
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ caseId, className }) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set())
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['GetAuditLogs', caseId],
    queryFn: () => fetcher<{ auditLogs: AuditLogEntry[] }, { caseId: string }>(
      GET_AUDIT_LOGS_QUERY,
      { caseId }
    )(),
    enabled: !!caseId,
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

  const getActivityColor = (activity: string): string => {
    if (activity.includes('create')) return 'bg-positive/20 text-positive border-positive/40'
    if (activity.includes('update')) return 'bg-primary/20 text-primary border-primary/40'
    if (activity.includes('delete')) return 'bg-negative/20 text-negative border-negative/40'
    return 'bg-secondary/20 text-secondary border-secondary/40'
  }

  const formatActivity = (activity: string): string => {
    return activity
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className={clsx('flex-col-2', className)}>
      <div className="text-sm font-semibold mb-2">
        Audit Log
      </div>
      {isLoading && (
        <div className="text-sm text-secondary/60 italic py-4">
          Loading...
        </div>
      )}
      <div className="flex-col-2 border-l-2 border-secondary/30 pl-4 ml-2">
        {auditLogs.map((entry: AuditLogEntry, index: number) => (
          <div key={index} className="relative flex-col-2 mb-4 last:mb-0">
            <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-background bg-secondary" />
            <div className={clsx('flex-col-2 p-2 rounded border', getActivityColor(entry.activity))}>
              <div className="flex-row-2 justify-between items-start">
                <div className="flex-col-2 flex-grow">
                  <div className="font-medium text-sm">
                    {formatActivity(entry.activity)}
                  </div>
                  {entry.userId && (
                    <button
                      onClick={() => setSelectedUserId(entry.userId)}
                      className="text-xs opacity-75 hover:opacity-100 hover:underline text-left"
                    >
                      By: {getUserName(entry.userId)}
                    </button>
                  )}
                  <div className="text-xs opacity-75">
                    <SmartDate date={new Date(entry.timestamp)} />
                  </div>
                </div>
                {entry.context && (() => {
                  try {
                    const parsed = JSON.parse(entry.context)
                    return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0
                  } catch {
                    return entry.context.length > 0
                  }
                })() && (
                  <button
                    onClick={() => toggleExpand(index)}
                    className="text-xs underline opacity-75 hover:opacity-100"
                  >
                    {expandedEntries.has(index)
                      ? 'Hide Details'
                      : 'Show Details'
                    }
                  </button>
                )}
              </div>
              {expandedEntries.has(index) && entry.context && (() => {
                try {
                  const parsed = JSON.parse(entry.context)
                  return (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(parsed, null, 2)}</pre>
                    </div>
                  )
                } catch {
                  return (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">
                      <pre>{entry.context}</pre>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        ))}
        {!isLoading && auditLogs.length === 0 && (
          <div className="text-sm text-secondary/60 italic py-4">
            No audit logs available
          </div>
        )}
      </div>
      <UserInfoPopup
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  )
}

