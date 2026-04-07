import type { FilterValue } from '@helpwave/hightide'
import { Chip } from '@helpwave/hightide'
import { User } from 'lucide-react'
import { useMemo } from 'react'
import { useUsers } from '@/data'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { FilterPreviewAvatar } from '@/components/tables/FilterPreviewMedia'

export function AssigneeFilterActiveLabel({ value }: { value: FilterValue }) {
  const translation = useTasksTranslation()
  const { data } = useUsers()
  const users = data?.users

  const content = useMemo(() => {
    const param = value?.parameter ?? {}
    const op = value?.operator ?? 'equals'
    if (op === 'contains') {
      const ids = (param.uuidValues as string[] | undefined) ?? []
      if (ids.length === 0) {
        return <span className="text-sm">{translation('selectAssignee')}</span>
      }
      if (ids.length <= 2) {
        return (
          <span className="flex flex-wrap items-center gap-1">
            {ids.map(id => {
              const user = users?.find(u => u.id === id)
              const title = user?.name ?? id
              return (
                <Chip key={id} size="sm" color="neutral" className="max-w-[11rem] py-0.5">
                  <span className="flex items-center gap-1 min-w-0">
                    {user ? (
                      <FilterPreviewAvatar name={user.name} avatarUrl={user.avatarUrl} />
                    ) : (
                      <User className="size-3 shrink-0 scale-90" />
                    )}
                    <span className="truncate text-sm">{title}</span>
                  </span>
                </Chip>
              )
            })}
          </span>
        )
      }
      return (
        <Chip size="sm" color="neutral" className="py-0.5">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center -space-x-1 shrink-0">
              {ids.slice(0, 3).map(id => {
                const user = users?.find(u => u.id === id)
                return user ? (
                  <FilterPreviewAvatar key={id} name={user.name} avatarUrl={user.avatarUrl} />
                ) : (
                  <User key={id} className="size-3 shrink-0 scale-90 opacity-70" />
                )
              })}
            </span>
            <span className="truncate text-sm">
              {ids.length} {translation('users')}
            </span>
          </span>
        </Chip>
      )
    }
    const uid = param.uuidValue != null ? String(param.uuidValue) : ''
    if (!uid) {
      return <span className="text-sm">{translation('selectAssignee')}</span>
    }
    const user = users?.find(u => u.id === uid)
    const title = user?.name ?? uid
    return (
      <Chip size="sm" color="neutral" className="max-w-[15rem] py-0.5">
        <span className="flex items-center gap-1 min-w-0">
          {user ? (
            <FilterPreviewAvatar name={user.name} avatarUrl={user.avatarUrl} />
          ) : (
            <User className="size-3 shrink-0 scale-90" />
          )}
          <span className="truncate text-sm">{title}</span>
        </span>
      </Chip>
    )
  }, [users, translation, value])

  return content
}
