import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row, TableState } from '@tanstack/react-table'
import type { GetOverviewDataQuery, TaskPriority } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import type { TableProps } from '@helpwave/hightide'
import { Button, Checkbox, FillerCell, TableDisplay, TableProvider, Tooltip } from '@helpwave/hightide'
import { ArrowRightIcon } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { DueDateUtils } from '@/utils/dueDate'
import { PriorityUtils } from '@/utils/priority'
import { PropertyEntity } from '@/api/gql/generated'
import { usePropertyDefinitions } from '@/data'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { useTableState } from '@/hooks/useTableState'
import { usePropertyColumnVisibility } from '@/hooks/usePropertyColumnVisibility'

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
  const { data: propertyDefinitionsData } = usePropertyDefinitions()

  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
  } = useTableState('recent-tasks')

  usePropertyColumnVisibility(
    propertyDefinitionsData,
    PropertyEntity.Task,
    columnVisibility,
    setColumnVisibility
  )

  const taskPropertyColumns = useMemo<ColumnDef<TaskViewModel>[]>(
    () => getPropertyColumnsForEntity<TaskViewModel>(propertyDefinitionsData, PropertyEntity.Task),
    [propertyDefinitionsData]
  )

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
              <ArrowRightIcon className="size-force-5" />
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
          <SmartDate
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
      id: 'date',
      header: translation('updated'),
      accessorFn: (value) => value.updateDate ? new Date(value.updateDate) : undefined,
      cell: ({ getValue }) => {
        const date = getValue() as Date | undefined
        if (!date) return <FillerCell />
        return (
          <SmartDate date={date} />
        )
      },
      minSize: 220,
      size: 220,
      maxSize: 220,
      enableResizing: false,
      filterFn: 'date',
    },
    ...taskPropertyColumns,
  ], [translation, completeTask, reopenTask, onSelectPatient, taskPropertyColumns])

  const fillerRowCell = useCallback(() => <FillerCell className="min-h-8" />, [])
  const onRowClick = useCallback((row: Row<TaskViewModel>) => onSelectTask(row.original.id), [onSelectTask])

  const fixedPagination = useMemo(() => ({
    ...pagination,
    pageSize: 10
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
            pageSize: 10,
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
    </div>
  )
}
