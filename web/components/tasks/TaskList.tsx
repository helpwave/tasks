import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react'
import { Button, Checkbox, ConfirmDialog, FillerCell, SearchBar, TableColumnSwitcher, TableDisplay, TablePagination, TableProvider, Tooltip, Visibility } from '@helpwave/hightide'
import { PlusIcon, Table as TableIcon, LayoutGrid, UserCheck, Users, Printer } from 'lucide-react'
import { useAssignTaskMutation, useAssignTaskToTeamMutation, useCompleteTaskMutation, useReopenTaskMutation } from '@/api/mutations/tasks'
import { useGetUsersQuery } from '@/api/queries/users'
import { useGetLocationsQuery } from '@/api/queries/locations'
import { useGetPropertyDefinitionsQuery } from '@/api/queries/properties'
import { GET_TASKS, useGetTasksQuery, type GetTasksData } from '@/api/queries/tasks'
import { useAsyncTableData } from '@/hooks/useAsyncTableData'
import { FieldType, PropertyEntity } from '@/api/types'
import type { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { AssigneeSelectDialog } from './AssigneeSelectDialog'
import clsx from 'clsx'
import { SmartDate } from '@/utils/date'
import { Drawer } from '@helpwave/hightide'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/patients/LocationChips'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useTaskViewToggle } from '@/hooks/useViewToggle'
import { TaskCardView } from '@/components/tasks/TaskCardView'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import type { ColumnDef } from '@tanstack/table-core'
import { PriorityUtils } from '@/utils/priority'

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
  baseVariables?: {
    rootLocationIds?: string[]
    assigneeId?: string
    assigneeTeamId?: string
  }
  showAssignee?: boolean,
  initialTaskId?: string,
  onInitialTaskOpened?: () => void,
  headerActions?: React.ReactNode,
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

const STORAGE_KEY_SHOW_DONE = 'task-show-done'

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ baseVariables, showAssignee = false, initialTaskId, onInitialTaskOpened, headerActions }, ref) => {
  const translation = useTasksTranslation()
  const { totalPatientsCount, user, selectedRootLocationIds } = useTasksContext()
  const { viewType, toggleView } = useTaskViewToggle()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [searchText, setSearchText] = useState('')
  const [completeTaskMutation] = useCompleteTaskMutation()
  const [reopenTaskMutation] = useReopenTaskMutation()
  const [assignTaskMutation] = useAssignTaskMutation()
  const [assignTaskToTeamMutation] = useAssignTaskToTeamMutation()
  const [, setIsPrinting] = useState(false)

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedUserPopupId, setSelectedUserPopupId] = useState<string | null>(null)
  const [taskDialogState, setTaskDialogState] = useState<TaskDialogState>({ isOpen: false })
  const [searchQuery, setSearchQuery] = useState('')
  const [openedTaskId, setOpenedTaskId] = useState<string | null>(null)

  useEffect(() => {
    setSearchText(searchQuery)
  }, [searchQuery])

  const effectiveBaseVariables = useMemo(() => ({
    rootLocationIds: baseVariables?.rootLocationIds || selectedRootLocationIds,
    assigneeId: baseVariables?.assigneeId || user?.id,
    assigneeTeamId: baseVariables?.assigneeTeamId,
  }), [baseVariables, selectedRootLocationIds, user?.id])


  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const isOpeningConfirmDialogRef = useRef(false)
  const [showDone, setShowDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_SHOW_DONE)
      if (stored === 'true') {
        return true
      }
      if (stored === 'false') {
        return false
      }
    }
    return false
  })

  const handleShowDoneChange = (checked: boolean) => {
    setShowDone(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SHOW_DONE, String(checked))
      }
      return checked
    })
  }

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


  const { data: usersData } = useGetUsersQuery(undefined, {})
  const { data: locationsData } = useGetLocationsQuery(undefined, {})

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
    if (openTasks.length === 0) {
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
        assignTaskToTeamMutation({ variables: { id: task.id, teamId: assigneeId } })
      } else {
        assignTaskMutation({ variables: { id: task.id, userId: assigneeId } })
      }
    })

    setIsConfirmDialogOpen(false)
    setSelectedUserId(null)
    setIsHandoverDialogOpen(false)
  }

  const baseColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    const cols: ColumnDef<TaskViewModel>[] = [
      {
        id: 'done',
        header: () => null,
        accessorKey: 'done',
        cell: ({ row }) => {
          const task = row.original
          return (
            <Checkbox
              value={task.done}
              onValueChange={(checked) => {
                if (checked) {
                  completeTaskMutation({ variables: { id: task.id } })
                } else {
                  reopenTaskMutation({ variables: { id: task.id } })
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
                <LocationChips locations={data.patient.locations || []} small />
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

    return cols
  }, [translation, completeTask, reopenTask, showAssignee, optimisticUpdates])

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const handleToggleDone = (taskId: string, checked: boolean) => {
    setOptimisticUpdates(prev => {
      const next = new Map(prev)
      next.set(taskId, checked)
      return next
    })
    if (checked) {
      completeTask({ id: taskId })
    } else {
      reopenTask({ id: taskId })
    }
  }

  const { data: fetchedTasksData, isLoading, totalCount, pageCount, refetch } = useAsyncTableData<
    GetTasksData,
    GetTasksData['tasks']['data'][0],
    typeof effectiveBaseVariables
  >({
    queryKey: ['GetTasks'],
    document: GET_TASKS,
    baseVariables: effectiveBaseVariables,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    columnFilters,
    searchText,
    columns: baseColumns,
    entityType: 'task',
    extractItems: (result) => {
      const tasks = result.tasks as any
      return (tasks?.data || tasks || []) as GetTasksQuery['tasks']['data']
    },
    extractTotalCount: (result) => {
      const tasks = result.tasks as any
      return tasks?.totalCount ?? (Array.isArray(tasks) ? tasks.length : 0)
    },
    enabled: !!effectiveBaseVariables.rootLocationIds && !!effectiveBaseVariables.assigneeId,
  })

  const propertyColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    return propertyDefinitionsData.propertyDefinitions
      .filter(def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task))
      .map(def => {
        const getFilterFn = () => {
          switch (def.fieldType) {
            case FieldType.FieldTypeText:
              return 'text'
            case FieldType.FieldTypeNumber:
              return 'number'
            case FieldType.FieldTypeCheckbox:
              return 'boolean'
            case FieldType.FieldTypeDate:
              return 'date'
            case FieldType.FieldTypeDateTime:
              return 'date'
            case FieldType.FieldTypeSelect:
              return 'tags'
            case FieldType.FieldTypeMultiSelect:
              return 'tags'
            default:
              return 'text'
          }
        }

        return {
          id: `property-${def.id}`,
          header: def.name,
          accessorFn: () => null,
          cell: ({ row }) => {
            const task = fetchedTasksData?.find(t => t.id === row.original.id)
            const propertyValue = task?.properties?.find(p => p.definition.id === def.id)
            if (!propertyValue) return null

            const value = propertyValue.textValue ?? propertyValue.numberValue ?? propertyValue.booleanValue ?? propertyValue.dateValue ?? propertyValue.dateTimeValue ?? propertyValue.selectValue ?? propertyValue.multiSelectValues
            if (!value) return null

            switch (def.fieldType) {
              case FieldType.FieldTypeText:
                return String(value)
              case FieldType.FieldTypeNumber:
                return String(value)
              case FieldType.FieldTypeCheckbox:
                return value ? translation('yes') : translation('no')
              case FieldType.FieldTypeDate:
              case FieldType.FieldTypeDateTime:
                return <SmartDate date={new Date(value)} showTime={def.fieldType === FieldType.FieldTypeDateTime} />
              case FieldType.FieldTypeSelect:
                return String(value)
              case FieldType.FieldTypeMultiSelect:
                return Array.isArray(value) ? value.join(', ') : String(value)
              default:
                return String(value)
            }
          },
          minSize: 150,
          size: 200,
          maxSize: 300,
          filterFn: getFilterFn(),
          meta: {
            filterData: {
              propertyDefinitionId: def.id,
              ...(def.fieldType === FieldType.FieldTypeSelect || def.fieldType === FieldType.FieldTypeMultiSelect) && def.options.length > 0 ? {
                tags: def.options.map(opt => ({ label: opt, tag: opt })),
              } : {},
            }
          }
        } as ColumnDef<TaskViewModel>
      })
  }, [propertyDefinitionsData, translation, fetchedTasksData])

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(() => [
    ...baseColumns,
    ...propertyColumns,
  ], [baseColumns, propertyColumns])

  const fetchedTasks: TaskViewModel[] = useMemo(() => {
    if (!fetchedTasksData || fetchedTasksData.length === 0) return []
    return fetchedTasksData.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority || null,
      estimatedTime: task.estimatedTime ?? null,
      done: task.done,
      patient: task.patient
        ? {
          id: task.patient.id,
          name: task.patient.name,
          locations: task.patient.assignedLocations || []
        }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
        : undefined,
      assigneeTeam: task.assigneeTeam
        ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
        : undefined,
    }))
  }, [fetchedTasksData])

  useEffect(() => {
    if (initialTaskId && fetchedTasks.length > 0 && openedTaskId !== initialTaskId) {
      setTaskDialogState({ isOpen: true, taskId: initialTaskId })
      setOpenedTaskId(initialTaskId)
      onInitialTaskOpened?.()
    } else if (!initialTaskId) {
      setOpenedTaskId(null)
    }
  }, [initialTaskId, fetchedTasks, openedTaskId, onInitialTaskOpened])


  const tasks = useMemo(() => {
    let data = fetchedTasks

    if (!showDone) {
      data = data.filter(t => !t.done)
    }

    return data
  }, [fetchedTasks, showDone])

  const openTasks = useMemo(() => {
    return fetchedTasks.filter(t => !t.done && t.assignee?.id === user?.id)
  }, [fetchedTasks, user?.id])

  const handlePrint = () => {
    window.print()
  }

  const fillerRow = useCallback(() => (
    <FillerCell className="min-h-12"/>
  ), [])

  return (
    <TableProvider
      data={tasks}
      columns={columns}
      fillerRowCell={fillerRow}
      state={{
        pagination,
        sorting,
        columnFilters,
      } as any}
      onPaginationChange={(updater: any) => {
        setPagination(typeof updater === 'function' ? updater(pagination) : updater)
      }}
      onSortingChange={(updater: any) => {
        setSorting(typeof updater === 'function' ? updater(sorting) : updater)
        setPagination({ ...pagination, pageIndex: 0 })
      }}
      onColumnFiltersChange={(updater: any) => {
        setColumnFilters(typeof updater === 'function' ? updater(columnFilters) : updater)
        setPagination({ ...pagination, pageIndex: 0 })
      }}
      pageCount={pageCount}
      manualPagination={true}
      manualSorting={true}
      manualFiltering={true}
      enableMultiSort={true}
      onRowClick={row => setTaskDialogState({ isOpen: true, taskId: row.original.id })}
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
            <Visibility isVisible={viewType === 'table'}>
              <TableColumnSwitcher />
            </Visibility>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 w-full sm:w-auto sm:ml-auto lg:pr-4">
            <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Checkbox
                  value={showDone}
                  onValueChange={handleShowDoneChange}
                />
                <span className="text-sm text-description whitespace-nowrap">{translation('showDone') || 'Show done'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip tooltip={translation(viewType !== 'table' ? 'printOnlyAvailableInTableMode' : 'print')} position="top">
                  <Button
                    disabled={viewType !== 'table'}
                    layout="icon"
                    color="neutral"
                    coloringStyle="text"
                    onClick={handlePrint}
                  >
                    <Printer className="size-5" />
                  </Button>
                </Tooltip>
                <Tooltip tooltip={translation('tableView')} position="top">
                  <Button
                    layout="icon"
                    color={viewType === 'table' ? 'primary' : 'neutral'}
                    coloringStyle={viewType === 'table' ? undefined : 'text'}
                    onClick={() => toggleView('table')}
                  >
                    <TableIcon className="size-5" />
                  </Button>
                </Tooltip>
                <Tooltip tooltip={translation('cardView')} position="top">
                  <Button
                    layout="icon"
                    color={viewType === 'card' ? 'primary' : 'neutral'}
                    coloringStyle={viewType === 'card' ? undefined : 'text'}
                    onClick={() => toggleView('card')}
                  >
                    <LayoutGrid className="size-5" />
                  </Button>
                </Tooltip>
              </div>
            </div>
            {headerActions}
            {openTasks.length > 0 && (
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
        <Visibility isVisible={viewType === 'table'}>
          <div className="flex-col-3 items-center">
            <TableDisplay className="print-content" />
            <TablePagination />
          </div>
        </Visibility>
        <Visibility isVisible={viewType === 'card'}>
          <div className="grid gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            {tasks.length === 0 ? (
              <div className="w-full text-center text-description py-8 col-span-full">
                {translation('noOpenTasks')}
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCardView
                  key={task.id}
                  task={task}
                  onToggleDone={handleToggleDone}
                  onClick={(t) => setTaskDialogState({ isOpen: true, taskId: t.id })}
                  showAssignee={showAssignee}
                  onRefetch={refetch}
                  className={clsx('w-full')}
                />
              ))
            )}
          </div>
        </Visibility>
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
            onSuccess={refetch}
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
              onSuccess={refetch}
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
