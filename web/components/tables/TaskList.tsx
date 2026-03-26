import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback, memo, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FilterListItem } from '@helpwave/hightide'
import { Button, Checkbox, ConfirmDialog, FilterList, FillerCell, HelpwaveLogo, IconButton, SearchBar, TableColumnSwitcher, TableDisplay, TableProvider, SortingList, ExpansionIcon } from '@helpwave/hightide'
import clsx from 'clsx'
import { LayoutGrid, PlusIcon, Table2, UserCheck, Users } from 'lucide-react'
import type { IdentifierFilterValue } from '@helpwave/hightide'
import type { TaskPriority, GetTasksQuery, QueryableField } from '@/api/gql/generated'
import { FieldType, PropertyEntity } from '@/api/gql/generated'
import { useAssignTask, useAssignTaskToTeam, useCompleteTask, useReopenTask, useUsers, useLocations, usePropertyDefinitions, useQueryableFields, useRefreshingEntityIds } from '@/data'
import { AssigneeSelectDialog } from '@/components/tasks/AssigneeSelectDialog'
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
import { useStableSerializedList } from '@/hooks/useStableSerializedList'
import { columnIdsFromColumnDefs, sanitizeColumnOrderForKnownColumns } from '@/utils/columnOrder'
import { DueDateUtils } from '@/utils/dueDate'
import { PriorityUtils } from '@/utils/priority'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { useColumnVisibilityWithPropertyDefaults } from '@/hooks/usePropertyColumnVisibility'
import { queryableFieldsToFilterListItems, queryableFieldsToSortingListItems, type QueryableChoiceTagLabelResolver } from '@/utils/queryableFilterList'
import { LIST_PAGE_SIZE } from '@/utils/listPaging'
import { TaskCardView } from '@/components/tasks/TaskCardView'
import { RefreshingTaskIdsContext, TaskRowRefreshingGate } from '@/components/tables/TaskRowRefreshingGate'
import { ExpandableTextBlock } from '@/components/common/ExpandableTextBlock'

type TaskAssigneeTableCellProps = {
  assigneeId: string,
  avatarURL: string | null | undefined,
  name: string,
  isOnline: boolean | null,
  onOpenUser: (id: string) => void,
  printHiddenNameLine: string,
  extraCountLabel: string | null,
}

const TaskAssigneeTableCell = memo(function TaskAssigneeTableCell({
  assigneeId,
  avatarURL,
  name,
  isOnline,
  onOpenUser,
  printHiddenNameLine,
  extraCountLabel,
}: TaskAssigneeTableCellProps) {
  const image = useMemo(
    () => ({
      avatarUrl: avatarURL || 'https://cdn.helpwave.de/boringavatar.svg',
      alt: name,
    }),
    [avatarURL, name]
  )
  return (
    <>
      <span className="print:block hidden">{printHiddenNameLine}</span>
      <div className="flex-row-2 items-center gap-1.5 flex-wrap min-w-0 print:hidden">
        <button
          type="button"
          onClick={() => onOpenUser(assigneeId)}
          className="flex-row-2 items-center min-w-0 hover:opacity-75 transition-opacity"
        >
          <AvatarStatusComponent
            isOnline={isOnline}
            image={image}
          />
          <span className="truncate">{name}</span>
        </button>
        {extraCountLabel != null && (
          <span className="text-description text-sm font-medium tabular-nums shrink-0">
            {extraCountLabel}
          </span>
        )}
      </div>
    </>
  )
})

function taskListDataSyncKey(tasks: TaskViewModel[]): string {
  return tasks.map(t => `${t.id}:${t.done}:${t.updateDate.getTime()}`).join('\0')
}

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
  loadMore?: () => void,
  hasMore?: boolean,
}

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened, headerActions, saveViewSlot, totalCount, loading = false, tableState: controlledTableState, searchQuery: searchQueryProp, onSearchQueryChange, loadMore: loadMoreProp, hasMore: hasMoreProp }, ref) => {
  const translation = useTasksTranslation()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const { data: queryableFieldsData } = useQueryableFields('Task')
  const queryableFieldsStable = useStableSerializedList(
    queryableFieldsData?.queryableFields,
    (f) => ({
      key: f.key,
      label: f.label,
      filterable: f.filterable,
      sortable: f.sortable,
      sortDirections: f.sortDirections,
      propertyDefinitionId: f.propertyDefinitionId,
      kind: f.kind,
      valueType: f.valueType,
      choice: f.choice
        ? { keys: f.choice.optionKeys, labels: f.choice.optionLabels }
        : null,
    })
  )

  const [clientVisibleCount, setClientVisibleCount] = useState(LIST_PAGE_SIZE)
  const [listLayout, setListLayout] = useState<'table' | 'card'>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 'card' : 'table'
  ))
  const [internalSorting, setInternalSorting] = useState<SortingState>(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ])
  const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>([])
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({})
  const [internalColumnOrder, setInternalColumnOrder] = useState<ColumnOrderState>([])

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
  const [isMobileIOS, setIsMobileIOS] = useState(false)

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

  const initialTaskPresent = Boolean(initialTaskId && initialTasks.some(t => t.id === initialTaskId))

  const initialTasksSyncKey = useMemo(
    () => taskListDataSyncKey(initialTasks),
    [initialTasks]
  )

  useEffect(() => {
    if (initialTaskId && initialTaskPresent && openedTaskId !== initialTaskId) {
      setTaskDialogState({ isOpen: true, taskId: initialTaskId })
      setOpenedTaskId(initialTaskId)
      onInitialTaskOpened?.()
    } else if (!initialTaskId) {
      setOpenedTaskId(null)
    }
  }, [initialTaskId, initialTaskPresent, openedTaskId, onInitialTaskOpened])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
    const update = () => {
      setIsMobileIOS(isIOSDevice && mediaQuery.matches)
    }
    update()
    mediaQuery.addEventListener('change', update)
    return () => {
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

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
  }, [initialTasksSyncKey, initialTasks])

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

  useEffect(() => {
    if (isServerDriven) return
    setClientVisibleCount(LIST_PAGE_SIZE)
  }, [initialTasksSyncKey, searchQuery, isServerDriven])

  const displayedTasks = useMemo(() => {
    if (isServerDriven) return tasks
    return tasks.slice(0, clientVisibleCount)
  }, [isServerDriven, tasks, clientVisibleCount])

  const tablePagination = useMemo(
    (): PaginationState => ({
      pageIndex: 0,
      pageSize: Math.max(displayedTasks.length, 1),
    }),
    [displayedTasks.length]
  )

  const effectiveHasMore = isServerDriven ? (hasMoreProp ?? false) : tasks.length > clientVisibleCount

  const handleLoadMore = useCallback(() => {
    if (isServerDriven) loadMoreProp?.()
    else setClientVisibleCount(c => c + LIST_PAGE_SIZE)
  }, [isServerDriven, loadMoreProp])

  const showBlockingLoadingOverlay = loading && displayedTasks.length === 0

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

  const resolveTaskQueryableLabel = useCallback((field: QueryableField): string => {
    if (field.propertyDefinitionId) return field.label
    const translatedByKey: Partial<Record<string, string>> = {
      done: translation('done'),
      title: translation('title'),
      name: translation('title'),
      description: translation('description'),
      dueDate: translation('dueDate'),
      priority: translation('priorityLabel'),
      patient: translation('patient'),
      assignee: translation('assignedTo'),
      assigneeTeam: translation('assigneeTeam'),
      updated: translation('updated'),
      updateDate: translation('updated'),
      position: translation('location'),
      state: translation('status'),
      firstname: translation('firstName'),
      lastname: translation('lastName'),
      birthdate: translation('birthdate'),
      estimatedTime: translation('estimatedTime'),
      creationDate: translation('creationDate'),
    }
    return translatedByKey[field.key] ?? field.label
  }, [translation])

  const resolveTaskChoiceTagLabel = useCallback<QueryableChoiceTagLabelResolver>((field, optionKey, backendLabel) => {
    if (field.propertyDefinitionId) return backendLabel
    if (field.key === 'priority') return translation('priority', { priority: optionKey })
    return backendLabel
  }, [translation])

  const availableFilters: FilterListItem[] = useMemo(() => {
    const raw = queryableFieldsStable
    if (raw?.length) {
      return queryableFieldsToFilterListItems(
        raw,
        propertyFieldTypeByDefId,
        resolveTaskQueryableLabel,
        resolveTaskChoiceTagLabel
      )
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
  }, [queryableFieldsStable, propertyFieldTypeByDefId, resolveTaskQueryableLabel, resolveTaskChoiceTagLabel, translation, propertyDefinitionsData?.propertyDefinitions])

  const availableSortItems = useMemo(() => {
    const raw = queryableFieldsStable
    if (raw?.length) {
      return queryableFieldsToSortingListItems(raw, resolveTaskQueryableLabel)
    }
    return availableFilters.map(({ id, label, dataType }) => ({ id, label, dataType }))
  }, [queryableFieldsStable, availableFilters, resolveTaskQueryableLabel])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    const cols: ColumnDef<TaskViewModel>[] = [
      {
        id: 'done',
        header: () => null,
        accessorKey: 'done',
        cell: ({ row }) => {
          const task = row.original
          const displayDone = task.done
          return (
            <TaskRowRefreshingGate taskId={task.id}>
              <div
                className="relative z-10"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
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
                      })
                    } else {
                      reopenTask({
                        variables: { id: task.id },
                      })
                    }
                  }}
                  className={clsx('not-print:rounded-full', PriorityUtils.toCheckboxColor(task.priority as TaskPriority | null | undefined))}
                />
              </div>
            </TaskRowRefreshingGate>
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
        cell: ({ row }) => (
          <TaskRowRefreshingGate taskId={row.original.id}>
            <div className="flex-row-2 items-center">
              {row.original.priority && (
                <div className={clsx('w-2 h-2 rounded-full shrink-0', PriorityUtils.toBackgroundColor(row.original.priority as TaskPriority | null | undefined))} />
              )}
              <span>{row.original.name}</span>
            </div>
          </TaskRowRefreshingGate>
        ),
        minSize: 200,
        size: 300,
        filterFn: 'text',
      },
      {
        id: 'dueDate',
        header: translation('dueDate'),
        accessorKey: 'dueDate',
        cell: ({ row }) => {
          if (!row.original.dueDate) {
            return (
              <TaskRowRefreshingGate taskId={row.original.id}>
                <span className="text-description">-</span>
              </TaskRowRefreshingGate>
            )
          }
          const overdue = DueDateUtils.isOverdue(row.original.dueDate, row.original.done)
          const closeToDue = DueDateUtils.isCloseToDueDate(row.original.dueDate, row.original.done)
          let colorClass = ''
          if (overdue) {
            colorClass = 'text-red-500'
          } else if (closeToDue) {
            colorClass = 'text-orange-500'
          }
          return (
            <TaskRowRefreshingGate taskId={row.original.id}>
              <DateDisplay
                date={row.original.dueDate}
                mode="absolute"
                className={clsx(colorClass)}
              />
            </TaskRowRefreshingGate>
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
          const data = row.original
          if (!data.patient) {
            return (
              <TaskRowRefreshingGate taskId={row.original.id}>
                <span className="text-description">
                  {translation('noPatient')}
                </span>
              </TaskRowRefreshingGate>
            )
          }
          return (
            <TaskRowRefreshingGate taskId={row.original.id}>
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
            </TaskRowRefreshingGate>
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
              <TaskRowRefreshingGate taskId={row.original.id}>
                <span className="text-description">
                  {translation('notAssigned')}
                </span>
              </TaskRowRefreshingGate>
            )
          }

          if (assigneeTeam) {
            return (
              <TaskRowRefreshingGate taskId={row.original.id}>
                <div className="flex-row-2 items-center">
                  <Users className="size-5 text-description print:hidden" />
                  <span>{assigneeTeam.title}</span>
                </div>
              </TaskRowRefreshingGate>
            )
          }

          if (assignee) {
            const extra = row.original.additionalAssigneeCount ?? 0
            const printLine = `${assignee.name}${extra > 0 ? ` ${translation('additionalAssigneesCount', { count: extra })}` : ''}`
            return (
              <TaskRowRefreshingGate taskId={row.original.id}>
                <TaskAssigneeTableCell
                  assigneeId={assignee.id}
                  avatarURL={assignee.avatarURL}
                  name={assignee.name}
                  isOnline={assignee.isOnline ?? null}
                  onOpenUser={setSelectedUserPopupId}
                  printHiddenNameLine={printLine}
                  extraCountLabel={extra > 0 ? translation('additionalAssigneesCount', { count: extra }) : null}
                />
              </TaskRowRefreshingGate>
            )
          }

          return (
            <TaskRowRefreshingGate taskId={row.original.id}>
              <span className="text-description">
                {translation('notAssigned')}
              </span>
            </TaskRowRefreshingGate>
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
          ? (params: { row: { original: TaskViewModel } }) => (
            <TaskRowRefreshingGate taskId={params.row.original.id}>
              {(col.cell as (p: unknown) => React.ReactNode)(params)}
            </TaskRowRefreshingGate>
          )
          : undefined,
      })),
    ]
    return colsWithRefreshing
  },
  [translation, completeTask, reopenTask, showAssignee, taskPropertyColumns])

  const taskCardPrimaryColumnIds = useMemo(() => {
    const s = new Set<string>(['done', 'title', 'dueDate', 'patient'])
    if (showAssignee) s.add('assignee')
    return s
  }, [showAssignee])

  const renderTaskCardExtras = useCallback((task: TaskViewModel): ReactNode => {
    const rows: ReactNode[] = []
    for (const col of columns) {
      const id = col.id as string | undefined
      if (!id || taskCardPrimaryColumnIds.has(id)) continue
      if (columnVisibility[id] === false) continue
      if (!col.cell) continue
      const isExpandableTextProperty = id.startsWith('property_') &&
        propertyFieldTypeByDefId.get(id.replace('property_', '')) === FieldType.FieldTypeText
      const headerLabel = typeof col.header === 'string' ? col.header : id
      const cell = (col.cell as (p: { row: { original: TaskViewModel } }) => ReactNode)({ row: { original: task } })
      const propertyId = id.startsWith('property_') ? id.replace('property_', '') : null
      const propertyTextValue = propertyId
        ? task.properties?.find(property => property.definition.id === propertyId)?.textValue
        : null
      rows.push(
        <div key={id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 sm:items-start text-left">
          <span className="text-description shrink-0 min-w-[7rem]">{headerLabel}</span>
          <div className="min-w-0 break-words">
            {isExpandableTextProperty ? (
              <ExpandableTextBlock>{propertyTextValue ?? ''}</ExpandableTextBlock>
            ) : cell}
          </div>
        </div>
      )
    }
    if (rows.length === 0) return null
    return <>{rows}</>
  }, [columns, columnVisibility, taskCardPrimaryColumnIds, propertyFieldTypeByDefId])

  const knownColumnIdsOrdered = useMemo(
    () => columnIdsFromColumnDefs(columns),
    [columns]
  )

  const sanitizedColumnOrder = useMemo(
    () => sanitizeColumnOrderForKnownColumns(columnOrder, knownColumnIdsOrdered),
    [columnOrder, knownColumnIdsOrdered]
  )

  const deferSetColumnOrder = useDeferredColumnOrderChange(setColumnOrder)
  const hasOpenDrawer = taskDialogState.isOpen || selectedPatientId != null
  const hasFilterPanelOpen = isShowFilters || isShowSorting

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isMobileIOS && hasOpenDrawer) {
      document.body.dataset['taskDrawerFullscreen'] = 'true'
    } else {
      delete document.body.dataset['taskDrawerFullscreen']
    }

    return () => {
      delete document.body.dataset['taskDrawerFullscreen']
    }
  }, [isMobileIOS, hasOpenDrawer])

  return (
    <RefreshingTaskIdsContext.Provider value={refreshingTaskIds}>
      <TableProvider
        data={displayedTasks}
        columns={columns}
        fillerRowCell={useCallback(() => (<FillerCell className="min-h-12" />), [])}
        initialState={{
          pagination: {
            pageSize: LIST_PAGE_SIZE,
          }
        }}
        state={{
          columnVisibility,
          columnOrder: sanitizedColumnOrder,
          pagination: tablePagination,
        } as Partial<TableState> as TableState}
        onColumnVisibilityChange={setColumnVisibilityMerged}
        onColumnOrderChange={deferSetColumnOrder}
        onPaginationChange={() => {}}
        onSortingChange={setSorting}
        onColumnFiltersChange={setFilters}
        enableMultiSort={true}
        enablePinning={false}
        onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
        pageCount={1}
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
                <div className="inline-flex flex-wrap gap-2 items-center shrink-0">
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
                </div>
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
                  tooltip={translation('listViewTable')}
                  className="min-h-11 min-w-11"
                  onClick={() => setListLayout('table')}
                  color={listLayout === 'table' ? 'primary' : 'neutral'}
                >
                  <Table2 className="size-5" />
                </IconButton>
                <IconButton
                  tooltip={translation('listViewCard')}
                  className="min-h-11 min-w-11"
                  onClick={() => setListLayout('card')}
                  color={listLayout === 'card' ? 'primary' : 'neutral'}
                >
                  <LayoutGrid className="size-5" />
                </IconButton>
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
              <div className="relative z-[140] touch-auto">
                <FilterList
                  value={filters as IdentifierFilterValue[]}
                  onValueChange={setFilters}
                  availableItems={availableFilters}
                />
              </div>
            )}
            {isShowSorting && (
              <div className="relative z-[140] touch-auto">
                <SortingList
                  sorting={sorting}
                  onSortingChange={setSorting}
                  availableItems={availableSortItems}
                />
              </div>
            )}
          </div>
          <div className={clsx('flex-col-3 w-full relative print:static', isMobileIOS && hasFilterPanelOpen && 'pointer-events-none')}>
            {showBlockingLoadingOverlay && (
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
            <div className={clsx('w-full', listLayout === 'table' ? 'block' : 'hidden print:block')}>
              <TableDisplay className="print-content w-full overflow-x-auto touch-pan-x"/>
            </div>
            {listLayout === 'card' && (
              <div className="flex flex-col gap-3 w-full print:hidden">
                {displayedTasks.map((task) => (
                  <TaskCardView
                    key={task.id}
                    task={task}
                    showAssignee={showAssignee}
                    showPatient={true}
                    onClick={() => setTaskDialogState({ isOpen: true, taskId: task.id })}
                    extraContent={renderTaskCardExtras(task)}
                  />
                ))}
              </div>
            )}
            {effectiveHasMore && (
              <Button color="neutral" className="mt-2 w-full sm:w-auto self-center" onClick={handleLoadMore}>
                {translation('loadMore')}
              </Button>
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
              onListSync={onRefetch}
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
                onSuccess={() => {
                  onRefetch?.()
                }}
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
          <style>{`
            body[data-task-drawer-fullscreen="true"] [role="dialog"] {
              width: 100dvw !important;
              min-width: 100dvw !important;
              max-width: 100dvw !important;
              left: 0 !important;
              right: 0 !important;
              margin: 0 !important;
              border-radius: 0 !important;
            }
          `}</style>
        </div>
      </TableProvider>
    </RefreshingTaskIdsContext.Provider>
  )
})

TaskList.displayName = 'TaskList'
