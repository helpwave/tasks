import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FilterListItem } from '@helpwave/hightide'
import { Button, Checkbox, ConfirmDialog, FilterList, FillerCell, HelpwaveLogo, IconButton, LoadingContainer, SearchBar, TableColumnSwitcher, TableDisplay, TablePagination, TableProvider, SortingList, ExpansionIcon } from '@helpwave/hightide'
import { PlusIcon, UserCheck, Users } from 'lucide-react'
import type { IdentifierFilterValue } from '@helpwave/hightide'
import type { TaskPriority, GetTasksQuery } from '@/api/gql/generated'
import { PropertyEntity } from '@/api/gql/generated'
import { useAssignTask, useAssignTaskToTeam, useCompleteTask, useReopenTask, useUsers, useLocations, usePropertyDefinitions, useQueryableFields, useRefreshingEntityIds } from '@/data'
import { AssigneeSelectDialog } from '@/components/tasks/AssigneeSelectDialog'
import clsx from 'clsx'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { Drawer } from '@helpwave/hightide'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import type { ColumnDef, ColumnFiltersState, ColumnOrderState, PaginationState, SortingState, TableState, VisibilityState } from '@tanstack/table-core'
import type { Dispatch, SetStateAction } from 'react'
import { useDeferredColumnOrderChange } from '@/hooks/useDeferredColumnOrderChange'
import { columnIdsFromColumnDefs, sanitizeColumnOrderForKnownColumns } from '@/utils/columnOrder'
import { DueDateUtils } from '@/utils/dueDate'
import { PriorityUtils } from '@/utils/priority'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { useColumnVisibilityWithPropertyDefaults } from '@/hooks/usePropertyColumnVisibility'
import { queryableFieldsToFilterListItems, queryableFieldsToSortingListItems } from '@/utils/queryableFilterList'

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
  /** Additional user assignees beyond the first (omit when team assignment). */
  additionalAssigneeCount?: number,
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

type TaskListTableState = {
  pagination: PaginationState,
  setPagination: Dispatch<SetStateAction<PaginationState>>,
  sorting: SortingState,
  setSorting: Dispatch<SetStateAction<SortingState>>,
  filters: ColumnFiltersState,
  setFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
  columnVisibility: VisibilityState,
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>,
  columnOrder: ColumnOrderState,
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>,
}

type TaskListProps = {
  tasks: TaskViewModel[],
  onRefetch?: () => void,
  showAssignee?: boolean,
  initialTaskId?: string,
  onInitialTaskOpened?: () => void,
  headerActions?: React.ReactNode,
  saveViewSlot?: React.ReactNode,
  totalCount?: number,
  loading?: boolean,
  tableState?: TaskListTableState,
  searchQuery?: string,
  onSearchQueryChange?: (value: string) => void,
}

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened, headerActions, saveViewSlot, totalCount, loading = false, tableState: controlledTableState, searchQuery: searchQueryProp, onSearchQueryChange }, ref) => {
  const translation = useTasksTranslation()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const { data: queryableFieldsData } = useQueryableFields('Task')

  const [internalPagination, setInternalPagination] = useState<PaginationState>({ pageSize: 10, pageIndex: 0 })
  const [internalSorting, setInternalSorting] = useState<SortingState>(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ])
  const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>([])
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({})
  const [internalColumnOrder, setInternalColumnOrder] = useState<ColumnOrderState>([])

  const lastTotalCountRef = useRef<number | undefined>(undefined)
  if (totalCount != null) lastTotalCountRef.current = totalCount
  const stableTotalCount = totalCount ?? lastTotalCountRef.current

  const pagination = controlledTableState?.pagination ?? internalPagination
  const setPagination = controlledTableState?.setPagination ?? setInternalPagination
  const sorting = controlledTableState?.sorting ?? internalSorting
  const setSorting = controlledTableState?.setSorting ?? setInternalSorting
  const filters = controlledTableState?.filters ?? internalFilters
  const setFilters = controlledTableState?.setFilters ?? setInternalFilters
  const columnVisibility = controlledTableState?.columnVisibility ?? internalColumnVisibility
  const setColumnVisibilityRaw = controlledTableState?.setColumnVisibility ?? setInternalColumnVisibility
  const columnOrder = controlledTableState?.columnOrder ?? internalColumnOrder
  const setColumnOrder = controlledTableState?.setColumnOrder ?? setInternalColumnOrder

  const setColumnVisibilityMerged = useColumnVisibilityWithPropertyDefaults(
    propertyDefinitionsData,
    PropertyEntity.Task,
    setColumnVisibilityRaw
  )

  const queryClient = useQueryClient()
  const { totalPatientsCount, user } = useTasksContext()
  const { refreshingTaskIds } = useRefreshingEntityIds()
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map())
  const [completeTask] = useCompleteTask()
  const [reopenTask] = useReopenTask()
  const [assignTask] = useAssignTask()
  const [assignTaskToTeam] = useAssignTaskToTeam()

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedUserPopupId, setSelectedUserPopupId] = useState<string | null>(null)
  const [taskDialogState, setTaskDialogState] = useState<TaskDialogState>({ isOpen: false })
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const searchQuery = searchQueryProp !== undefined ? searchQueryProp : internalSearchQuery
  const setSearchQuery = onSearchQueryChange ?? setInternalSearchQuery
  const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)
  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const isOpeningConfirmDialogRef = useRef(false)
  const [isShowFilters, setIsShowFilters] = useState(false)
  const [isShowSorting, setIsShowSorting] = useState(false)

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

  const isServerDriven = totalCount != null

  const tasks = useMemo(() => {
    let data = initialTasks.map(task => {
      const optimisticDone = optimisticUpdates.get(task.id)
      if (optimisticDone !== undefined) {
        return { ...task, done: optimisticDone }
      }
      return task
    })

    if (!isServerDriven && searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      data = data.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        (t.patient?.name.toLowerCase().includes(lowerQuery) ?? false))
    }

    if (!isServerDriven) {
      return [...data].sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1
        }

        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1

        return a.dueDate.getTime() - b.dueDate.getTime()
      })
    }
    return data
  }, [initialTasks, optimisticUpdates, searchQuery, isServerDriven])


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

  const taskPropertyColumns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => getPropertyColumnsForEntity<TaskViewModel>(propertyDefinitionsData, PropertyEntity.Task),
    [propertyDefinitionsData]
  )

  const propertyFieldTypeByDefId = useMemo(
    () => new Map(propertyDefinitionsData?.propertyDefinitions.map(d => [d.id, d.fieldType]) ?? []),
    [propertyDefinitionsData]
  )

  const availableFilters: FilterListItem[] = useMemo(() => {
    const raw = queryableFieldsData?.queryableFields
    if (raw?.length) {
      return queryableFieldsToFilterListItems(raw, propertyFieldTypeByDefId)
    }
    return [
      { id: 'title', label: translation('title'), dataType: 'text', tags: [] },
      { id: 'description', label: translation('description'), dataType: 'text', tags: [] },
      { id: 'dueDate', label: translation('dueDate'), dataType: 'date', tags: [] },
      {
        id: 'priority',
        label: translation('priorityLabel'),
        dataType: 'singleTag',
        tags: ['P1', 'P2', 'P3', 'P4'].map(p => ({ label: translation('priority', { priority: p }), tag: p })),
      },
      { id: 'patient', label: translation('patient'), dataType: 'text', tags: [] },
      { id: 'assignee', label: translation('assignedTo'), dataType: 'text', tags: [] },
      ...propertyDefinitionsData?.propertyDefinitions.map(def => ({
        id: `property_${def.id}`,
        label: def.name,
        dataType: 'text' as const,
        tags: def.options.map((opt, idx) => ({ label: opt, tag: `${def.id}-opt-${idx}` })),
      })) ?? [],
    ]
  }, [queryableFieldsData?.queryableFields, propertyFieldTypeByDefId, translation, propertyDefinitionsData?.propertyDefinitions])

  const availableSortItems = useMemo(() => {
    const raw = queryableFieldsData?.queryableFields
    if (raw?.length) {
      return queryableFieldsToSortingListItems(raw)
    }
    return availableFilters.map(({ id, label, dataType }) => ({ id, label, dataType }))
  }, [queryableFieldsData?.queryableFields, availableFilters])

  const rowLoadingCell = useMemo(() => <LoadingContainer className="w-full min-h-8" />, [])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    const cols: ColumnDef<TaskViewModel>[] = [
      {
        id: 'done',
        header: () => null,
        accessorKey: 'done',
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
              className={clsx('not-print:rounded-full', PriorityUtils.toCheckboxColor(task.priority as TaskPriority | null | undefined))}
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
          const overdue = DueDateUtils.isOverdue(row.original.dueDate, row.original.done)
          const closeToDue = DueDateUtils.isCloseToDueDate(row.original.dueDate, row.original.done)
          let colorClass = ''
          if (overdue) {
            colorClass = 'text-red-500'
          } else if (closeToDue) {
            colorClass = 'text-orange-500'
          }
          return (
            <DateDisplay
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
              <span className="print:block hidden">{data.patient?.name}</span>
              <Button
                color="neutral"
                size="sm"
                onClick={event => {
                  event.stopPropagation()
                  setSelectedPatientId(data.patient?.id ?? null)
                }}
                className="flex-row-0 justify-start w-fit print:hidden"
              >
                {data.patient?.name}
              </Button>
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
                <Users className="size-5 text-description print:hidden" />
                <span>{assigneeTeam.title}</span>
              </div>
            )
          }

          if (assignee) {
            const extra = row.original.additionalAssigneeCount ?? 0
            return (
              <>
                <span className="print:block hidden">
                  {assignee.name}
                  {extra > 0 ? ` ${translation('additionalAssigneesCount', { count: extra })}` : ''}
                </span>
                <div className="flex-row-2 items-center gap-1.5 flex-wrap min-w-0 print:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedUserPopupId(assignee.id)}
                    className="flex-row-2 items-center min-w-0 hover:opacity-75 transition-opacity"
                  >
                    <AvatarStatusComponent
                      isOnline={assignee?.isOnline ?? null}
                      image={{
                        avatarUrl: assignee.avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
                        alt: assignee.name
                      }}
                    />
                    <span className="truncate">{assignee.name}</span>
                  </button>
                  {extra > 0 && (
                    <span className="text-description text-sm font-medium tabular-nums shrink-0">
                      {translation('additionalAssigneesCount', { count: extra })}
                    </span>
                  )}
                </div>
              </>
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

  const knownColumnIdsOrdered = useMemo(
    () => columnIdsFromColumnDefs(columns),
    [columns]
  )

  const sanitizedColumnOrder = useMemo(
    () => sanitizeColumnOrderForKnownColumns(columnOrder, knownColumnIdsOrdered),
    [columnOrder, knownColumnIdsOrdered]
  )

  const deferSetColumnOrder = useDeferredColumnOrderChange(setColumnOrder)

  return (
    <TableProvider
      data={tasks}
      columns={columns}
      fillerRowCell={useCallback(() => (<FillerCell className="min-h-12" />), [])}
      initialState={{
        pagination: {
          pageSize: 10,
        }
      }}
      state={{
        columnVisibility,
        columnOrder: sanitizedColumnOrder,
        pagination,
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={setColumnVisibilityMerged}
      onColumnOrderChange={deferSetColumnOrder}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onColumnFiltersChange={setFilters}
      enableMultiSort={true}
      enablePinning={false}
      onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
      pageCount={stableTotalCount != null ? Math.ceil(stableTotalCount / pagination.pageSize) : -1}
      manualPagination={true}
      manualSorting={true}
      manualFiltering={true}
      enableColumnFilters={false}
      enableSorting={false}
      enableColumnPinning={false}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex-col-2 w-full">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-row-8 sm:justify-between sm:gap-0 w-full">
            <div className="flex flex-wrap gap-2 items-center">
              <SearchBar
                placeholder={translation('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={() => null}
                containerProps={{ className: 'w-full max-w-full min-w-0 sm:max-w-80' }}
              />
              <TableColumnSwitcher
                buttonProps={{ className: 'min-h-11 min-w-11 shrink-0' }}
                style={{ zIndex: 120 }}
              />
              <Button
                onClick={() => setIsShowFilters(!isShowFilters)}
                color="neutral"
                className="font-semibold element"
              >
                {translation('filter') + ` (${filters.length})`}
                <ExpansionIcon isExpanded={isShowFilters} className="size-5" />
              </Button>
              <Button
                onClick={() => setIsShowSorting(!isShowSorting)}
                color="neutral"
                className="font-semibold"
              >
                {translation('sorting') + ` (${sorting.length})`}
                <ExpansionIcon isExpanded={isShowSorting} className="size-5" />
              </Button>
              {saveViewSlot}
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end shrink-0">
              {headerActions}
              {canHandover && (
                <Button
                  onClick={handleHandoverClick}
                  className="w-fit"
                >
                  <UserCheck className="size-5" />
                  {translation('shiftHandover') || 'Shift Handover'}
                </Button>
              )}
              <IconButton
                tooltip={translation('addTask')}
                color="primary"
                className="min-h-11 min-w-11"
                onClick={() => setTaskDialogState({ isOpen: true })}
                disabled={!hasPatients}
              >
                <PlusIcon />
              </IconButton>
            </div>
          </div>
          {isShowFilters && (
            <FilterList
              value={filters as IdentifierFilterValue[]}
              onValueChange={setFilters}
              availableItems={availableFilters}
            />
          )}
          {isShowSorting && (
            <SortingList
              sorting={sorting}
              onSortingChange={setSorting}
              availableItems={availableSortItems}
            />
          )}
        </div>
        <div className="flex-col-3 items-center relative print:static">
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
          <TableDisplay className="print-content overflow-x-auto touch-pan-x"/>
          {totalCount != null && (
            <TablePagination
              allowChangingPageSize={true}
              pageSizeOptions={[10, 25, 50]}
              className="mt-2"
            />
          )}
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
