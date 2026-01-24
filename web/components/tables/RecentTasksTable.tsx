import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { GetOverviewDataQuery } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { Button, Checkbox, FillerCell, Table, TableColumnSwitcher, Tooltip } from '@helpwave/hightide'
import { ArrowRightIcon } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { DueDateUtils } from '@/utils/dueDate'

type TaskViewModel = GetOverviewDataQuery['recentTasks'][0]

export interface RecentTasksTableProps {
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
}: RecentTasksTableProps) => {
  const translation = useTasksTranslation()
  const taskColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => [
    {
      id: 'done',
      header: translation('status'),
      accessorKey: 'done',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            value={row.original.done}
            onValueChange={(checked) => {
              if (!checked) {
                completeTask(row.original.id)
              } else {
                reopenTask(row.original.id)
              }
            }}
            className={clsx('rounded-full')}
          />
        </div>
      ),
      minSize: 130,
      size: 130,
      maxSize: 130,
      enableResizing: false,
      filterFn: 'boolean',
    },
    {
      id: 'title',
      header: translation('task'),
      accessorKey: 'title',
      cell: ({ row }) => {
        return (
          <span className="typography-title-sm">{row.original.title}</span>
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
        if (!patient) return <FillerCell/>

        return (
          <Tooltip tooltip={translation('rShow', { name: patient.name })} containerClassName="overflow-hidden w-full">
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
              <span className="truncate overflow-ellipsis">{patient.name}</span>
              <ArrowRightIcon className="size-force-5"/>
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
      minSize: 200,
      size: 200,
      maxSize: 200,
      filterFn: 'date',
    },
    {
      id: 'date',
      header: translation('updated'),
      accessorFn: (value) => value.updateDate ? new Date(value.updateDate) : undefined,
      cell: ({ getValue }) => {
        const date = getValue() as Date | undefined
        if (!date) return <FillerCell/>
        return (
          <SmartDate date={date}/>
        )
      },
      minSize: 200,
      size: 200,
      maxSize: 200,
      filterFn: 'date',
    }
  ], [translation, completeTask, reopenTask, onSelectPatient])

  return (
    <Table
      table={{
        data: tasks,
        columns: taskColumns,
        fillerRow: useCallback(() => (<FillerCell className="min-h-6"/>), []),
        onRowClick: useCallback((row: Row<TaskViewModel>) => onSelectTask(row.original.id), [onSelectTask])
      }}
      header={(
        <div className="flex-row-4 justify-between items-center">
          <div className="flex-col-0">
            <span className="typography-title-lg">{translation('recentTasks')}</span>
            <span className="text-description">{translation('tasksUpdatedRecently')}</span>
          </div>
          <div>
            <TableColumnSwitcher/>
          </div>
        </div>
      )}
    />
  )
}