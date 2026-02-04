import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox, ConfirmDialog, FillerCell, HelpwaveLogo, LoadingContainer, SearchBar, Select, SelectOption, TableColumnSwitcher, TableDisplay, TableProvider, Tooltip } from '@helpwave/hightide'
import { PlusIcon, UserCheck, Users } from 'lucide-react'
import type { TaskPriority, GetTasksQuery } from '@/api/gql/generated'
import { PropertyEntity } from '@/api/gql/generated'
import { useAssignTask, useAssignTaskToTeam, useCompleteTask, useReopenTask, useUsers, useLocations, usePropertyDefinitions, useRefreshingEntityIds } from '@/data'
import { AssigneeSelectDialog } from '@/components/tasks/AssigneeSelectDialog'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { Drawer } from '@helpwave/hightide'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState, TableState, VisibilityState } from '@tanstack/table-core'
import { PriorityUtils } from '@/utils/priority'
import { createPropertyColumn } from '@/utils/propertyColumn'
import { useStateWithLocalStorage } from '@/hooks/useStateWithLocalStorage'

export type TaskViewModel = {
  id: string,
  name: string,
  description?: string,
  updateDate: Date,
  dueDate?: Date,
  priority?: string | null,
  estimatedTime?: number | null,
  patient?: {
    id: string,
    name: string,
    locations: Array<{
      id: string,
      title: string,
      parent?: { id: string, title: string, parent?: { id: string, title: string } | null } | null,
    }>,
  },
  assignee?: { id: string, name: string, avatarURL?: string | null, isOnline?: boolean | null },
  assigneeTeam?: { id: string, title: string },
  done: boolean,
  properties?: GetTasksQuery['tasks'][0]['properties'],
}

export type TaskListRef = {
  openCreate: () => void,
  openTask: (taskId: string) => void,
}

type TaskDialogState = {
  isOpen: boolean,
  taskId?: string,
}

type TaskListProps = {
  tasks: TaskViewModel[],
  onRefetch?: () => void,
  showAssignee?: boolean,
  initialTaskId?: string,
  onInitialTaskOpened?: () => void,
  headerActions?: React.ReactNode,
  totalCount?: number,
  loading?: boolean,
  showAllTasksMode?: boolean,
}

const isOverdue = (dueDate: Date | undefined, done: boolean): boolean => {
  if (!dueDate || done) return false
  return dueDate.getTime() < Date.now()
}

const isCloseToDueDate = (dueDate: Date | undefined, done: boolean): boolean => {
  if (!dueDate || done) return false
  const now = Date.now()
  const dueTime = dueDate.getTime()
  const oneHour = 60 * 60 * 1000
  return dueTime > now && dueTime - now <= oneHour
}



const STORAGE_KEY_COLUMN_VISIBILITY = 'task-list-column-visibility'
const STORAGE_KEY_COLUMN_FILTERS = 'task-list-column-filters'
const STORAGE_KEY_COLUMN_SORTING = 'task-list-column-sorting'
const STORAGE_KEY_COLUMN_PAGINATION = 'task-list-column-pagination'

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened, headerActions, totalCount, loading = false, showAllTasksMode = false }, ref) => {
  const translation = useTasksTranslation()

  const [pagination, setPagination] = useStateWithLocalStorage<PaginationState>({
    key: STORAGE_KEY_COLUMN_PAGINATION,
    defaultValue: {
      pageSize: 10,
      pageIndex: 0
    }
  })
  const [sorting, setSorting] = useStateWithLocalStorage<SortingState>({
    key: STORAGE_KEY_COLUMN_SORTING,
    defaultValue: [
      { id: 'done', desc: false },
      { id: 'dueDate', desc: false },
    ]
  })
  const [filters, setFilters] = useStateWithLocalStorage<ColumnFiltersState>({
    key: STORAGE_KEY_COLUMN_FILTERS,
    defaultValue: []
  })
  const normalizeDoneFilterValue = useCallback((value: unknown): boolean | undefined => {
    if (value === true || value === 'true' || value === 'done') return true
    if (value === false || value === 'false' || value === 'undone') return false
    return undefined
  }, [])
  const rawDoneFilterValue = filters.find(f => f.id === 'done')?.value
  const storedDoneFilterValue = rawDoneFilterValue === true || rawDoneFilterValue === 'true' || rawDoneFilterValue === 'done'
    ? 'done'
    : rawDoneFilterValue === false || rawDoneFilterValue === 'false' || rawDoneFilterValue === 'undone'
      ? 'undone'
      : 'all'
  const doneFilterValue = showAllTasksMode ? 'all' : storedDoneFilterValue
  const setDoneFilter = useCallback((value: boolean | 'all') => {
    setFilters(prev => {
      const rest = prev.filter(f => f.id !== 'done')
      if (value === 'all') return rest
      return [...rest, { id: 'done', value }]
    })
  }, [setFilters])
  const setFiltersNormalized = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    setFilters(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next.flatMap(f => {
        if (f.id !== 'done') return [f]
        const normalized = normalizeDoneFilterValue(f.value)
        if (normalized === undefined) return []
        return [{ ...f, value: normalized }]
      })
    })
  }, [setFilters, normalizeDoneFilterValue])
  const [columnVisibility, setColumnVisibility] = useStateWithLocalStorage<VisibilityState>({
    key: STORAGE_KEY_COLUMN_VISIBILITY,
    defaultValue: {}
  })

  const queryClient = useQueryClient()
  const { totalPatientsCount, user } = useTasksContext()
  const { refreshingTaskIds } = useRefreshingEntityIds()
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map())
  const { data: propertyDefinitionsData } = usePropertyDefinitions()

  useEffect(() => {
    if (propertyDefinitionsData?.propertyDefinitions) {
      const taskProperties = propertyDefinitionsData.propertyDefinitions.filter(
        def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
      )
      const propertyColumnIds = taskProperties.map(prop => `property_${prop.id}`)
      const hasPropertyColumnsInVisibility = propertyColumnIds.some(id => id in columnVisibility)

      if (!hasPropertyColumnsInVisibility && propertyColumnIds.length > 0) {
        const initialVisibility: VisibilityState = { ...columnVisibility }
        propertyColumnIds.forEach(id => {
          initialVisibility[id] = false
        })
        setColumnVisibility(initialVisibility)
      }
    }
  }, [propertyDefinitionsData, columnVisibility, setColumnVisibility])
  const [completeTask] = useCompleteTask()
  const [reopenTask] = useReopenTask()
  const [assignTask] = useAssignTask()
  const [assignTaskToTeam] = useAssignTaskToTeam()

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedUserPopupId, setSelectedUserPopupId] = useState<string | null>(null)
  const [taskDialogState, setTaskDialogState] = useState<TaskDialogState>({ isOpen: false })
  const [searchQuery, setSearchQuery] = useState('')
  const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)
  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const isOpeningConfirmDialogRef = useRef(false)

  const hasPatients = (totalPatientsCount ?? 0) > 0

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      if (hasPatients) {
        setTaskDialogState({ isOpen: true })
      }
    },
    openTask: (taskId: string) => {
      setTaskDialogState({ isOpen: true, taskId })
    }
  }))

  useEffect(() => {
    if (initialTaskId && initialTasks.length > 0 && openedTaskId !== initialTaskId) {
      setTaskDialogState({ isOpen: true, taskId: initialTaskId })
      setOpenedTaskId(initialTaskId)
      onInitialTaskOpened?.()
    } else if (!initialTaskId) {
      setOpenedTaskId(null)
    }
  }, [initialTaskId, initialTasks, openedTaskId, onInitialTaskOpened])

  useEffect(() => {
    setOptimisticUpdates(prev => {
      const next = new Map(prev)
      let hasChanges = false

      for (const [taskId, optimisticDone] of next.entries()) {
        const task = initialTasks.find(t => t.id === taskId)
        if (task && task.done === optimisticDone) {
          next.delete(taskId)
          hasChanges = true
        }
      }

      return hasChanges ? next : prev
    })
  }, [initialTasks])

  const tasks = useMemo(() => {
    let data = initialTasks.map(task => {
      const optimisticDone = optimisticUpdates.get(task.id)
      if (optimisticDone !== undefined) {
        return { ...task, done: optimisticDone }
      }
      return task
    })

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      data = data.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.patient?.name.toLowerCase().includes(lowerQuery))
    }

    return [...data].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1
      }

      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      return a.dueDate.getTime() - b.dueDate.getTime()
    })
  }, [initialTasks, optimisticUpdates, searchQuery])


  const openTasks = useMemo(() => {
    const tasksWithOptimistic = initialTasks.map(task => {
      const optimisticDone = optimisticUpdates.get(task.id)
      if (optimisticDone !== undefined) {
        return { ...task, done: optimisticDone }
      }
      return task
    })
    return tasksWithOptimistic.filter(t => !t.done && t.assignee?.id === user?.id)
  }, [initialTasks, optimisticUpdates, user?.id])

  const canHandover = openTasks.length > 0

  const { data: usersData } = useUsers()
  const { data: locationsData } = useLocations()

  const teams = useMemo(() => {
    if (!locationsData?.locationNodes) return []
    return locationsData.locationNodes.filter(loc => loc.kind === 'TEAM')
  }, [locationsData])

  const users = useMemo(() => {
    return usersData?.users || []
  }, [usersData])

  const getSelectedUserOrTeam = useMemo(() => {
    if (!selectedUserId) return null
    if (selectedUserId.startsWith('team:')) {
      const teamId = selectedUserId.replace('team:', '')
      const team = teams.find(t => t.id === teamId)
      return team ? { type: 'team' as const, name: team.title, id: team.id } : null
    }
    const user = users.find(u => u.id === selectedUserId)
    return user ? { type: 'user' as const, name: user.name, id: user.id, user } : null
  }, [selectedUserId, teams, users])

  const handleHandoverClick = () => {
    if (!canHandover) {
      return
    }
    setSelectedUserId(null)
    setIsHandoverDialogOpen(true)
  }

  const handleUserSelect = (userId: string) => {
    isOpeningConfirmDialogRef.current = true
    setSelectedUserId(userId)
    setIsHandoverDialogOpen(false)
    setIsConfirmDialogOpen(true)
    setTimeout(() => {
      isOpeningConfirmDialogRef.current = false
    }, 0)
  }

  const handleConfirmHandover = () => {
    if (!selectedUserId) {
      console.warn('No selectedUserId for handover')
      return
    }

    if (openTasks.length === 0) {
      console.warn('No open tasks to handover')
      setIsConfirmDialogOpen(false)
      setSelectedUserId(null)
      setIsHandoverDialogOpen(false)
      return
    }

    const isTeam = selectedUserId.startsWith('team:')
    const assigneeId = isTeam ? selectedUserId.replace('team:', '') : selectedUserId

    openTasks.forEach(task => {
      if (isTeam) {
        assignTaskToTeam({
          variables: { id: task.id, teamId: assigneeId },
          onCompleted: () => onRefetch?.(),
        })
      } else {
        assignTask({
          variables: { id: task.id, userId: assigneeId },
          onCompleted: () => onRefetch?.(),
        })
      }
    })
    queryClient.invalidateQueries({ queryKey: ['GetTasks'] })
    queryClient.invalidateQueries({ queryKey: ['GetPatients'] })
    queryClient.invalidateQueries({ queryKey: ['GetOverviewData'] })
    queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })

    setIsConfirmDialogOpen(false)
    setSelectedUserId(null)
    setIsHandoverDialogOpen(false)
  }

  const taskProperties = useMemo(() => {
    return propertyDefinitionsData?.propertyDefinitions
      .filter(def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)) ?? []
  }, [propertyDefinitionsData])

  const taskPropertyColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    return taskProperties.map(prop => createPropertyColumn<TaskViewModel>(prop))
  }, [taskProperties])


  const rowLoadingCell = useMemo(() => <LoadingContainer className="w-full min-h-8" />, [])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    const cols: ColumnDef<TaskViewModel>[] = [
      {
        id: 'done',
        header: () => null,
        accessorKey: 'done',
        enableColumnFilter: true,
        filterFn: (row, _columnId, filterValue: boolean | string | undefined) => {
          if (filterValue === undefined || filterValue === 'all') return true
          const wantDone = filterValue === true || filterValue === 'done' || filterValue === 'true'
          const wantUndone = filterValue === false || filterValue === 'undone' || filterValue === 'false'
          if (!wantDone && !wantUndone) return true
          return wantDone ? row.getValue('done') === true : row.getValue('done') === false
        },
        cell: ({ row }) => {
          if (refreshingTaskIds.has(row.original.id)) return rowLoadingCell
          const task = row.original
          const optimisticDone = optimisticUpdates.get(task.id)
          const displayDone = optimisticDone !== undefined ? optimisticDone : task.done
          return (
            <Checkbox
              value={displayDone}
              onValueChange={(checked) => {
                setOptimisticUpdates(prev => {
                  const next = new Map(prev)
                  next.set(task.id, checked)
                  return next
                })
                if (checked) {
                  completeTask({
                    variables: { id: task.id },
                    onCompleted: () => onRefetch?.(),
                  })
                } else {
                  reopenTask({
                    variables: { id: task.id },
                    onCompleted: () => onRefetch?.(),
                  })
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={clsx('rounded-full', PriorityUtils.toCheckboxColor(task.priority as TaskPriority | null | undefined))}
            />
          )
        },
        minSize: 60,
        size: 60,
        maxSize: 60,
        enableResizing: false,
      },
      {
        id: 'title',
        header: translation('title'),
        accessorKey: 'name',
        cell: ({ row }) => {
          if (refreshingTaskIds.has(row.original.id)) return rowLoadingCell
          return (
            <div className="flex-row-2 items-center">
              {row.original.priority && (
                <div className={clsx('w-2 h-2 rounded-full shrink-0', PriorityUtils.toBackgroundColor(row.original.priority as TaskPriority | null | undefined))} />
              )}
              <span>{row.original.name}</span>
            </div>
          )
        },
        minSize: 200,
        size: 300,
        filterFn: 'text',
      },
      {
        id: 'dueDate',
        header: translation('dueDate'),
        accessorKey: 'dueDate',
        cell: ({ row }) => {
          if (refreshingTaskIds.has(row.original.id)) return rowLoadingCell
          if (!row.original.dueDate) return <span className="text-description">-</span>
          const overdue = isOverdue(row.original.dueDate, row.original.done)
          const closeToDue = isCloseToDueDate(row.original.dueDate, row.original.done)
          let colorClass = ''
          if (overdue) {
            colorClass = '!text-red-500'
          } else if (closeToDue) {
            colorClass = '!text-orange-500'
          }
          return (
            <SmartDate
              date={row.original.dueDate}
              mode="relative"
              className={clsx(colorClass)}
            />
          )
        },
        minSize: 220,
        size: 220,
        maxSize: 220,
        enableResizing: false,
        filterFn: 'date',
      },
      {
        id: 'patient',
        header: translation('patient'),
        accessorFn: ({ patient }) => patient?.name,
        cell: ({ row }) => {
          if (refreshingTaskIds.has(row.original.id)) return rowLoadingCell
          const data = row.original
          if (!data.patient) {
            return (
              <span className="text-description">
                {translation('noPatient')}
              </span>
            )
          }
          return (
            <>
              <div className="flex flex-col gap-1 print:hidden">
                <Button
                  color="neutral"
                  size="sm"
                  onClick={event => {
                    event.stopPropagation()
                    setSelectedPatientId(data.patient?.id ?? null)
                  }}
                  className="flex-row-0 justify-start w-fit"
                >
                  {data.patient?.name}
                </Button>
              </div>
              <span className="hidden print:block">{data.patient?.name}</span>
            </>
          )
        },
        sortingFn: 'text',
        filterFn: 'text',
        minSize: 200,
        size: 250,
        maxSize: 350,
      },
    ]

    if (showAssignee) {
      cols.push({
        id: 'assignee',
        header: translation('assignedTo'),
        accessorFn: ({ assignee, assigneeTeam }) => assignee?.name || assigneeTeam?.title,
        cell: ({ row }) => {
          const assignee = row.original.assignee
          const assigneeTeam = row.original.assigneeTeam
          if (!assignee && !assigneeTeam) {
            return (
              <span className="text-description">
                {translation('notAssigned')}
              </span>
            )
          }

          if (assigneeTeam) {
            return (
              <div className="flex-row-2 items-center">
                <Users className="size-5 text-description" />
                <span>{assigneeTeam.title}</span>
              </div>
            )
          }

          if (assignee) {
            return (
              <button
                onClick={() => setSelectedUserPopupId(assignee.id)}
                className="flex-row-2 items-center hover:opacity-75 transition-opacity"
              >
                <AvatarStatusComponent
                  isOnline={assignee?.isOnline ?? null}
                  image={{
                    avatarUrl: assignee.avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
                    alt: assignee.name
                  }}
                />
                <span>{assignee.name}</span>
              </button>
            )
          }

          return (
            <span className="text-description">
              {translation('notAssigned')}
            </span>
          )
        },
        minSize: 200,
        size: 250,
        maxSize: 350,
      })
    }

    const colsWithRefreshing = [
      ...cols,
      ...taskPropertyColumns.map((col) => ({
        ...col,
        cell: col.cell
          ? (params: { row: { original: TaskViewModel } }) =>
            refreshingTaskIds.has(params.row.original.id) ? rowLoadingCell : (col.cell as (p: unknown) => React.ReactNode)(params)
          : undefined,
      })),
    ]
    return colsWithRefreshing
  },
  [translation, completeTask, reopenTask, showAssignee, optimisticUpdates, taskPropertyColumns, refreshingTaskIds, rowLoadingCell, onRefetch])

  return (
    <TableProvider
      data={tasks}
      columns={columns}
      fillerRowCell={useCallback(() => (<FillerCell className="min-h-12"/>), [])}
      initialState={{
        pagination: {
          pageSize: 10,
        }
      }}
      state={{
        columnVisibility,
        pagination,
        sorting,
        columnFilters: showAllTasksMode ? filters.filter(f => f.id !== 'done') : filters,
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={setColumnVisibility}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onColumnFiltersChange={setFiltersNormalized}
      enableMultiSort={true}
      onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
      pageCount={totalCount ? Math.ceil(totalCount / pagination.pageSize) : undefined}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <div className="flex-row-2 items-center">
            <SearchBar
              placeholder={translation('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => null}
              containerProps={{ className: 'max-w-80 h-10' }}
            />
            <TableColumnSwitcher />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 w-full sm:w-auto sm:ml-auto lg:pr-4">
            <Select
              value={doneFilterValue}
              onValueChange={(v: string) => setDoneFilter(v === 'all' ? 'all' : v === 'done')}
              buttonProps={{ className: 'min-w-32' }}
              contentPanelProps={{ className: 'min-w-32' }}
            >
              <SelectOption value="all">{translation('filterAll') || 'All'}</SelectOption>
              <SelectOption value="undone">{translation('filterUndone') || 'Undone'}</SelectOption>
              <SelectOption value="done">{translation('done')}</SelectOption>
            </Select>
            {headerActions}
            {canHandover && (
              <Button
                onClick={handleHandoverClick}
                className="w-fit"
              >
                <UserCheck className="size-5"/>
                {translation('shiftHandover') || 'Shift Handover'}
              </Button>
            )}
            <Tooltip tooltip={translation('addTask')} position="top">
              <Button
                onClick={() => setTaskDialogState({ isOpen: true })}
                disabled={!hasPatients}
                layout="icon"
              >
                <PlusIcon/>
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="flex-col-3 items-center relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 rounded-lg min-h-48">
              <HelpwaveLogo animate="loading" color="currentColor" height={64} width={64} />
            </div>
          )}
          <style>{`
            table th[data-column-id="done"],
            table th[data-id="done"],
            table thead th:has([data-column-id="done"]),
            table thead th:has([data-id="done"]) {
              display: none !important;
            }
          `}</style>
          <TableDisplay className="print-content" />
        </div>
        <Drawer
          alignment="right"
          titleElement={taskDialogState.taskId ? translation('editTask') : translation('createTask')}
          description={undefined}
          isOpen={taskDialogState.isOpen}
          onClose={() => setTaskDialogState({ isOpen: false })}
        >
          <TaskDetailView
            taskId={taskDialogState.taskId ?? null}
            onClose={() => setTaskDialogState({ isOpen: false })}
            onSuccess={onRefetch || (() => {
            })}
          />
        </Drawer>
        <Drawer
          alignment="right"
          titleElement={translation('editPatient')}
          description={undefined}
          isOpen={!!selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        >
          {!!selectedPatientId && (
            <PatientDetailView
              patientId={selectedPatientId}
              onClose={() => setSelectedPatientId(null)}
              onSuccess={onRefetch || (() => {
              })}
            />
          )}
        </Drawer>
        <AssigneeSelectDialog
          value={selectedUserId || ''}
          onValueChanged={handleUserSelect}
          allowTeams={true}
          allowUnassigned={false}
          excludeUserIds={user?.id ? [user.id] : []}
          isOpen={isHandoverDialogOpen}
          onClose={() => {
            setIsHandoverDialogOpen(false)
            if (!isConfirmDialogOpen && !isOpeningConfirmDialogRef.current) {
              setSelectedUserId(null)
            }
          }}
          dialogTitle={translation('shiftHandover') || 'Shift Handover'}
          onUserInfoClick={(userId) => setSelectedUserPopupId(userId)}
        />
        {isConfirmDialogOpen && selectedUserId && (
          <ConfirmDialog
            isOpen={isConfirmDialogOpen}
            onCancel={() => {
              setIsConfirmDialogOpen(false)
              setSelectedUserId(null)
              setIsHandoverDialogOpen(false)
            }}
            onConfirm={() => {
              if (selectedUserId) {
                handleConfirmHandover()
              }
            }}
            titleElement={translation('confirmShiftHandover') || 'Confirm Shift Handover'}
            description={getSelectedUserOrTeam && openTasks.length > 0 ? translation('confirmShiftHandoverDescriptionWithName', {
              taskCount: openTasks.length,
              name: getSelectedUserOrTeam.name
            }) : (translation('confirmShiftHandoverDescription') || 'Are you sure you want to transfer all open tasks?')}
          />
        )}
        <UserInfoPopup
          userId={selectedUserPopupId}
          isOpen={!!selectedUserPopupId}
          onClose={() => setSelectedUserPopupId(null)}
        />
      </div>
    </TableProvider>
  )
})

TaskList.displayName = 'TaskList'
