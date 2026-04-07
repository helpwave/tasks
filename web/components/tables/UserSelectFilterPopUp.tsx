import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { Button, FilterBasePopUp, type FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { User } from 'lucide-react'
import { AssigneeSelectDialog } from '@/components/tasks/AssigneeSelectDialog'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { useUsers } from '@/data'
import { FilterPreviewAvatar } from '@/components/tables/FilterPreviewMedia'

export const UserSelectFilterPopUp = ({ value, onValueChange, onRemove, name }: FilterListPopUpBuilderProps) => {
  const translation = useTasksTranslation()
  const { data: usersData } = useUsers()
  const id = useId()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userInfoId, setUserInfoId] = useState<string | null>(null)

  const operator = useMemo(() => {
    const suggestion = value?.operator ?? 'equals'
    return suggestion === 'contains' ? 'contains' : 'equals'
  }, [value?.operator])

  const uuidValue = value?.parameter?.uuidValue
  const uuidValues = value?.parameter?.uuidValues
  const isMulti = operator === 'contains'

  const initialMultiUserIds = useMemo(() => {
    if (!isMulti) return []
    const v = uuidValues
    return Array.isArray(v) ? v.map(String) : []
  }, [isMulti, uuidValues])

  const singleValueForDialog = useMemo(() => {
    if (isMulti) return ''
    const u = uuidValue
    return u != null && String(u) !== '' ? String(u) : ''
  }, [isMulti, uuidValue])

  const summaryContent = useMemo((): ReactNode => {
    const users = usersData?.users
    if (isMulti) {
      const ids = (uuidValues as string[] | undefined) ?? []
      const n = ids.length
      if (n === 0) {
        return (
          <>
            <User className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{translation('selectAssignee')}</span>
          </>
        )
      }
      return (
        <>
          <span className="flex items-center -space-x-1 shrink-0">
            {ids.slice(0, 3).map(uid => {
              const user = users?.find(u => u.id === uid)
              return user ? (
                <FilterPreviewAvatar key={uid} name={user.name} avatarUrl={user.avatarUrl} />
              ) : (
                <User key={uid} className="size-3.5 shrink-0 scale-90 opacity-70" />
              )
            })}
          </span>
          <span className="truncate text-sm">
            {n} {translation('users')}
          </span>
        </>
      )
    }
    const uid = uuidValue != null && String(uuidValue) !== '' ? String(uuidValue) : undefined
    if (!uid) {
      return (
        <>
          <User className="size-4 shrink-0 opacity-60" />
          <span className="truncate">{translation('selectAssignee')}</span>
        </>
      )
    }
    const user = users?.find(u => u.id === uid)
    const label = user?.name ?? translation('selectAssignee')
    return (
      <>
        {user ? (
          <FilterPreviewAvatar name={user.name} avatarUrl={user.avatarUrl} />
        ) : (
          <User className="size-4 shrink-0 opacity-60" />
        )}
        <span className="truncate text-sm">{label}</span>
      </>
    )
  }, [isMulti, usersData?.users, uuidValue, uuidValues, translation])

  const handleSingleSelected = (selectedValue: string) => {
    const baseParam = value?.parameter ?? {}
    onValueChange({
      ...value,
      dataType: 'singleTag',
      operator: 'equals',
      parameter: { ...baseParam, uuidValue: selectedValue, uuidValues: undefined },
    })
    setDialogOpen(false)
  }

  const handleMultiUserIdsSelected = (ids: string[]) => {
    const baseParam = value?.parameter ?? {}
    onValueChange({
      ...value,
      dataType: 'singleTag',
      operator: 'contains',
      parameter: { ...baseParam, uuidValue: undefined, uuidValues: ids },
    })
    setDialogOpen(false)
  }

  return (
    <>
      <FilterBasePopUp
        name={name}
        operator={operator}
        outsideClickOptions={{ active: !dialogOpen }}
        onOperatorChange={(newOperator) => {
          const baseParam = value?.parameter ?? {}
          const next = newOperator === 'contains' ? 'contains' : 'equals'
          if (next === 'equals') {
            const u = baseParam.uuidValues
            const first = Array.isArray(u) && u.length > 0 ? String(u[0]) : undefined
            onValueChange({
              dataType: 'singleTag',
              parameter: { ...baseParam, uuidValue: first, uuidValues: undefined },
              operator: 'equals',
            })
          } else {
            const u = baseParam.uuidValue
            onValueChange({
              dataType: 'singleTag',
              parameter: {
                ...baseParam,
                uuidValue: undefined,
                uuidValues: u != null && String(u) !== '' ? [String(u)] : [],
              },
              operator: 'contains',
            })
          }
        }}
        onRemove={onRemove}
        allowedOperators={['equals', 'contains']}
        noParameterRequired={false}
      >
        <div className="flex-col-1 gap-2">
          <label htmlFor={id} className="typography-label-md">{translation('user')}</label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              id={id}
              type="button"
              color="neutral"
              coloringStyle="outline"
              className="inline-flex items-center gap-2 min-w-0 max-w-full h-auto py-1.5"
              onClick={() => setDialogOpen(true)}
            >
              {summaryContent}
            </Button>
          </div>
        </div>
      </FilterBasePopUp>
      <AssigneeSelectDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        value={singleValueForDialog}
        onValueChanged={handleSingleSelected}
        multiUserSelect={isMulti}
        onMultiUserIdsSelected={handleMultiUserIdsSelected}
        initialMultiUserIds={initialMultiUserIds}
        allowTeams={false}
        allowUnassigned={false}
        dialogTitle={translation('selectAssignee')}
        onUserInfoClick={(userId) => setUserInfoId(userId)}
      />
      <UserInfoPopup
        userId={userInfoId}
        isOpen={!!userInfoId}
        onClose={() => setUserInfoId(null)}
      />
    </>
  )
}
