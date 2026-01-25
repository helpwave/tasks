import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox, ConfirmDialog, FillerCell, SearchBar, Table, Tooltip, Visibility } from '@helpwave/hightide'
import { PlusIcon, Table as TableIcon, LayoutGrid, UserCheck, Users, Printer } from 'lucide-react'
import { useAssignTaskMutation, useAssignTaskToTeamMutation, useCompleteTaskMutation, useReopenTaskMutation, useGetUsersQuery, useGetLocationsQuery, type GetGlobalDataQuery } from '@/api/gql/generated'
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
  tasks: TaskViewModel[],
  onRefetch?: () => void,
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

const getPriorityColor = (priority: string | null | undefined): string => {
  if (!priority) return ''
  switch (priority) {
  case 'P1':
    return 'border-l-4 border-l-green-500'
  case 'P2':
    return 'border-l-4 border-l-blue-500'
  case 'P3':
    return 'border-l-4 border-l-orange-500'
  case 'P4':
    return 'border-l-4 border-l-red-500'
  default:
    return ''
  }
}

const getPriorityDotColor = (priority: string | null | undefined): string => {
  if (!priority) return ''
  switch (priority) {
  case 'P1':
    return 'bg-green-500'
  case 'P2':
    return 'bg-blue-500'
  case 'P3':
    return 'bg-orange-500'
  case 'P4':
    return 'bg-red-500'
  default:
    return ''
  }
}

const getPriorityCheckboxColor = (priority: string | null | undefined): string => {
  if (!priority) return ''
  switch (priority) {
  case 'P1':
    return 'border-green-500 text-green-500 data-[checked]:bg-green-500/30'
  case 'P2':
    return 'border-blue-500 text-blue-500 data-[checked]:bg-blue-500/30'
  case 'P3':
    return 'border-orange-500 text-orange-500 data-[checked]:bg-orange-500/30'
  case 'P4':
    return 'border-red-500 text-red-500 data-[checked]:bg-red-500/30'
  default:
    return ''
  }
}

const STORAGE_KEY_SHOW_DONE = 'task-show-done'

export const TaskList = forwardRef<TaskListRef, TaskListProps>(({ tasks: initialTasks, onRefetch, showAssignee = false, initialTaskId, onInitialTaskOpened, headerActions }, ref) => {
  const translation = useTasksTranslation()
  const queryClient = useQueryClient()
  const { totalPatientsCount, user, selectedRootLocationIds } = useTasksContext()
  const { viewType, toggleView } = useTaskViewToggle()
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map())
  const { mutate: completeTask } = useCompleteTaskMutation({
    onMutate: async (variables) => {
      const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
      await queryClient.cancelQueries({ queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }] })
      const previousData = queryClient.getQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }])
      if (previousData?.me?.tasks) {
        queryClient.setQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }], {
          ...previousData,
          me: previousData.me ? {
            ...previousData.me,
            tasks: previousData.me.tasks.map(task => task.id === variables.id ? { ...task, done: true } : task)
          } : null
        })
      }
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        next.set(variables.id, true)
        return next
      })
      return { previousData }
    },
    onSuccess: async () => {
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      await queryClient.invalidateQueries({ queryKey: ['GetTasks'] })
      await queryClient.invalidateQueries({ queryKey: ['GetPatients'] })
      onRefetch?.()
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
        queryClient.setQueryData(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }], context.previousData)
      }
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        next.delete(variables.id)
        return next
      })
    }
  })
  const { mutate: reopenTask } = useReopenTaskMutation({
    onMutate: async (variables) => {
      const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
      await queryClient.cancelQueries({ queryKey: ['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }] })
      const previousData = queryClient.getQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }])
      if (previousData?.me?.tasks) {
        queryClient.setQueryData<GetGlobalDataQuery>(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }], {
          ...previousData,
          me: previousData.me ? {
            ...previousData.me,
            tasks: previousData.me.tasks.map(task => task.id === variables.id ? { ...task, done: false } : task)
          } : null
        })
      }
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        next.set(variables.id, false)
        return next
      })
      return { previousData }
    },
    onSuccess: async () => {
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      await queryClient.invalidateQueries({ queryKey: ['GetTasks'] })
      await queryClient.invalidateQueries({ queryKey: ['GetPatients'] })
      onRefetch?.()
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        const selectedRootLocationIdsForQuery = selectedRootLocationIds && selectedRootLocationIds.length > 0 ? selectedRootLocationIds : undefined
        queryClient.setQueryData(['GetGlobalData', { rootLocationIds: selectedRootLocationIdsForQuery }], context.previousData)
      }
      setOptimisticUpdates(prev => {
        const next = new Map(prev)
        next.delete(variables.id)
        return next
      })
    }
  })
  const { mutate: assignTask } = useAssignTaskMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onRefetch?.()
    }
  })
  const { mutate: assignTaskToTeam } = useAssignTaskToTeamMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })
      onRefetch?.()
    }
  })
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

    if (!showDone) {
      data = data.filter(t => !t.done)
    }

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
  }, [initialTasks, optimisticUpdates, searchQuery, showDone])

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
        assignTaskToTeam({ id: task.id, teamId: assigneeId })
      } else {
        assignTask({ id: task.id, userId: assigneeId })
      }
    })

    queryClient.invalidateQueries({ queryKey: ['GetTask'] })
    queryClient.invalidateQueries({ queryKey: ['GetTasks'] })
    queryClient.invalidateQueries({ queryKey: ['GetPatients'] })
    queryClient.invalidateQueries({ queryKey: ['GetOverviewData'] })
    queryClient.invalidateQueries({ queryKey: ['GetGlobalData'] })

    setIsConfirmDialogOpen(false)
    setSelectedUserId(null)
    setIsHandoverDialogOpen(false)
  }

  const columns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    const cols: ColumnDef<TaskViewModel>[] = [
      {
        id: 'done',
        header: () => null,
        accessorKey: 'done',
        cell: ({ row }) => {
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
                  completeTask({ id: task.id })
                } else {
                  reopenTask({ id: task.id })
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={clsx('rounded-full', getPriorityCheckboxColor(task.priority))}
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
            <div className="flex items-center gap-2">
              {row.original.priority && (
                <div className={clsx('w-2 h-2 rounded-full shrink-0', getPriorityDotColor(row.original.priority))} />
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
        minSize: 200,
        size: 200,
        maxSize: 200,
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
            <div className="flex flex-col gap-1">
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
  },
  [translation, completeTask, reopenTask, showAssignee, optimisticUpdates])

  const handleToggleDone = (taskId: string, checked: boolean) => {
    const task = initialTasks.find(t => t.id === taskId)
    if (!task) return

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

  const handlePrint = () => {
    window.print()
  }

  const fillerRow = useCallback(() => (
    <FillerCell className="min-h-12"/>
  ), [])

  return (
    <div className="flex flex-col h-full gap-4 print-container">
      <div className="flex flex-col sm:flex-row justify-between w-full gap-4 print-header">
        <SearchBar
          placeholder={translation('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={() => null}
          containerProps={{ className: 'max-w-80 h-10' }}
        />
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
                  className="print-button"
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
      <Visibility isVisible={viewType === 'table'}>
        <Table
          table={{
            data: tasks,
            columns: columns,
            fillerRowCell: fillerRow,
            initialState: {
              sorting: [
                { id: 'done', desc: false },
                { id: 'dueDate', desc: false },
              ],
            },
            enableMultiSort: true,
            onRowClick: row => setTaskDialogState({ isOpen: true, taskId: row.original.id }),
          }}
          className="print-content"
        />
      </Visibility>
      <Visibility isVisible={viewType === 'card'}>
        <div className="grid gap-4 -mx-4 px-4 lg:mx-0 lg:pl-0 lg:pr-4 print-content" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
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
                onRefetch={onRefetch}
                className={clsx('w-full', getPriorityColor(task.priority))}
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
  )
})

TaskList.displayName = 'TaskList'
