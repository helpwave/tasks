import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, ColumnFiltersState, PaginationState, Row, SortingState, TableState, VisibilityState } from '@tanstack/react-table'
import type { GetOverviewDataQuery, TaskPriority } from '@/api/gql/generated'
import { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { TableProps } from '@helpwave/hightide'
import { Button, Checkbox, FillerCell, TableDisplay, TableProvider, Tooltip } from '@helpwave/hightide'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { AvatarStatusComponent } from '@/components/AvatarStatusComponent'
import { UserInfoPopup } from '@/components/UserInfoPopup'
import { DueDateUtils } from '@/utils/dueDate'
import { PriorityUtils } from '@/utils/priority'
import { Users } from 'lucide-react'

type TaskViewModel = GetOverviewDataQuery['recentTasks'][0]

export interface RecentTasksTableProps extends Omit<TableProps<TaskViewModel>, 'table'> {
  tasks: TaskViewModel[],
  completeTask: (id: string) => void,
  reopenTask: (id: string) => void,
  onSelectPatient: (id: string) => void,
  onSelectTask: (id: string) => void,
}


export const RecentTasksTable = ({
  tasks,
  completeTask,
  reopenTask,
  onSelectPatient,
  onSelectTask,
  ...props
}: RecentTasksTableProps) => {
  const translation = useTasksTranslation()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [pagination, setPagination] = useState<PaginationState>({ pageSize: 10, pageIndex: 0 })
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const taskColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => [
    {
      id: 'done',
      header: translation('done'),
      accessorKey: 'done',
      cell: ({ row }) => (
        <Checkbox
          value={row.original.done}
          onValueChange={(checked) => {
            if (checked) {
              completeTask(row.original.id)
            } else {
              reopenTask(row.original.id)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={clsx('rounded-full', PriorityUtils.toCheckboxColor(row.original.priority as TaskPriority | null | undefined))}
        />
      ),
      minSize: 60,
      size: 60,
      maxSize: 60,
      enableResizing: false,
      enableHiding: false,
    },
    {
      id: 'title',
      header: translation('task'),
      accessorKey: 'title',
      cell: ({ row }) => {
        return (
          <Tooltip tooltip={row.original.title} containerClassName="overflow-hidden w-full !block">
            <div className="flex-row-2 items-center">
              {row.original.priority && (
                <div className={clsx('w-2 h-2 rounded-full shrink-0', PriorityUtils.toBackgroundColor(row.original.priority as TaskPriority | null | undefined))} />
              )}
              <span className="typography-title-sm truncate block">{row.original.title}</span>
            </div>
          </Tooltip>
        )
      },
      minSize: 200,
      filterFn: 'text',
    },
    {
      id: 'patient',
      header: translation('patient'),
      accessorFn: (value) => value.patient?.name,
      cell: ({ row }) => {
        const patient = row.original.patient
        if (!patient) return <FillerCell />

        return (
          <Tooltip tooltip={translation('rShow', { name: patient.name })} containerClassName="overflow-hidden w-full !block">
            <Button
              color="neutral"
              coloringStyle="text"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelectPatient(patient.id)
              }}
              className="flex-row-1 w-full justify-between"
            >
              <span className="truncate block">{patient.name}</span>
            </Button>
          </Tooltip>
        )
      },
      minSize: 200,
      maxSize: 400,
      filterFn: 'text',
    },
    {
      id: 'dueDate',
      header: translation('dueDate'),
      accessorKey: 'dueDate',
      cell: ({ row }) => {
        if (!row.original.dueDate) return <span className="text-description">-</span>
        const overdue = DueDateUtils.isOverdue(row.original.dueDate, row.original.done)
        const closeToDue = DueDateUtils.isCloseToDueDate(row.original.dueDate, row.original.done)
        let colorClass = ''
        if (overdue) {
          colorClass = '!text-red-500'
        } else if (closeToDue) {
          colorClass = '!text-orange-500'
        }
        return (
          <DateDisplay
            date={new Date(row.original.dueDate)}
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
      id: 'assignee',
      header: translation('assignedTo'),
      accessorFn: (row) => {
        if (row.assigneeTeam) return row.assigneeTeam.title
        return row.assignees[0]?.name ?? ''
      },
      cell: ({ row }) => {
        const team = row.original.assigneeTeam
        if (team) {
          return (
            <div
              className="flex-row-2 items-center min-w-0"
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Users className="size-5 text-description shrink-0" />
              <span className="truncate">{team.title}</span>
            </div>
          )
        }
        const assignees = row.original.assignees ?? []
        const first = assignees[0]
        if (!first) {
          return <span className="text-description">{translation('notAssigned')}</span>
        }
        const extra = assignees.length > 1 ? assignees.length - 1 : 0
        return (
          <div
            className="flex-row-2 items-center gap-1.5 flex-wrap min-w-0"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedUserId(first.id)
              }}
              className="flex-row-2 items-center min-w-0 hover:opacity-75 transition-opacity text-left"
            >
              <AvatarStatusComponent
                isOnline={first.isOnline ?? null}
                image={{
                  avatarUrl: first.avatarUrl ?? 'https://cdn.helpwave.de/boringavatar.svg',
                  alt: first.name
                }}
              />
              <span className="truncate">{first.name}</span>
            </button>
            {extra > 0 && (
              <span className="text-description text-sm font-medium tabular-nums shrink-0">
                {translation('additionalAssigneesCount', { count: extra })}
              </span>
            )}
          </div>
        )
      },
      minSize: 180,
      size: 220,
      maxSize: 320,
      filterFn: 'text',
    },
    {
      id: 'date',
      header: translation('updated'),
      accessorFn: (value) => value.updateDate ? new Date(value.updateDate) : undefined,
      cell: ({ getValue }) => {
        const date = getValue() as Date | undefined
        if (!date) return <FillerCell />
        return (
          <DateDisplay date={date} />
        )
      },
      minSize: 220,
      size: 220,
      maxSize: 220,
      enableResizing: false,
      filterFn: 'date',
    },
  ], [translation, completeTask, reopenTask, onSelectPatient])

  const fillerRowCell = useCallback(() => <FillerCell className="min-h-8" />, [])
  const onRowClick = useCallback((row: Row<TaskViewModel>) => onSelectTask(row.original.id), [onSelectTask])

  const fixedPagination = useMemo(() => ({
    ...pagination,
    pageSize: 5
  }), [pagination])

  return (
    <div className="mt-2">
      <TableProvider
        data={tasks}
        columns={taskColumns}
        fillerRowCell={fillerRowCell}
        onRowClick={onRowClick}
        initialState={{
          pagination: {
            pageSize: 5,
          },
        }}
        state={{
          columnVisibility,
          pagination: fixedPagination,
          sorting,
          columnFilters: filters,
        } as Partial<TableState> as TableState}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onColumnFiltersChange={setFilters}
        enableMultiSort={true}
        isUsingFillerRows={true}
        enableSorting={false}
        enableColumnFilters={false}
      >
        <div className="flex flex-col h-full gap-4 w-full min-w-0" {...props}>
          <div className="flex-col-0">
            <span className="typography-title-lg">{translation('recentTasks')}</span>
            <span className="text-description">{translation('tasksUpdatedRecently')}</span>
          </div>
          <div className="w-full min-w-0 overflow-x-auto mt-4">
            <TableDisplay className="min-w-full" />
          </div>
        </div>
      </TableProvider>
      <UserInfoPopup
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  )
}
