import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { GetOverviewDataQuery, TaskPriority } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import type { TableProps } from '@helpwave/hightide'
import { Button, Checkbox, Chip, FillerCell, Table, TableColumnSwitcher, Tooltip } from '@helpwave/hightide'
import { ArrowRightIcon } from 'lucide-react'
import { SmartDate } from '@/utils/date'
import { DueDateUtils } from '@/utils/dueDate'
import { PriorityUtils } from '@/utils/priority'
import { useGetPropertyDefinitionsQuery, PropertyEntity, ColumnType, FieldType } from '@/api/gql/generated'

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
  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const taskPropertyColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    const taskProperties = propertyDefinitionsData.propertyDefinitions.filter(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
    )

    return taskProperties.map(prop => {
      const columnId = `property_${prop.id}`

      const getFilterFn = () => {
        switch (prop.fieldType) {
        case FieldType.FieldTypeCheckbox:
          return 'boolean'
        case FieldType.FieldTypeDate:
        case FieldType.FieldTypeDateTime:
          return 'date'
        case FieldType.FieldTypeNumber:
          return 'number'
        case FieldType.FieldTypeSelect:
        case FieldType.FieldTypeMultiSelect:
          return 'tags'
        default:
          return 'text'
        }
      }

      const extractOptionIndex = (value: string): number | null => {
        const match = value.match(/-opt-(\d+)$/)
        return match && match[1] ? parseInt(match[1], 10) : null
      }

      return {
        id: columnId,
        header: prop.name,
        accessorFn: (row) => {
          const property = row.properties?.find(
            p => p.definition.id === prop.id
          )
          if (!property) return null
          if (prop.fieldType === FieldType.FieldTypeMultiSelect) {
            return property.multiSelectValues ?? null
          }
          return (
            property.textValue ??
            property.numberValue ??
            property.booleanValue ??
            property.dateValue ??
            property.dateTimeValue ??
            property.selectValue ??
            null
          )
        },
        cell: ({ row }) => {
          const property = row.original.properties?.find(
            p => p.definition.id === prop.id
          )
          if (!property) return <FillerCell className="min-h-8" />

          if (typeof property.booleanValue === 'boolean') {
            return (
              <Chip
                className="coloring-tonal"
                color={property.booleanValue ? 'positive' : 'negative'}
              >
                {property.booleanValue
                  ? translation('yes')
                  : translation('no')}
              </Chip>
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeDate &&
            property.dateValue
          ) {
            return (
              <SmartDate
                date={new Date(property.dateValue)}
                showTime={false}
              />
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeDateTime &&
            property.dateTimeValue
          ) {
            return (
              <SmartDate date={new Date(property.dateTimeValue)} />
            )
          }

          if (
            prop.fieldType === FieldType.FieldTypeSelect &&
            property.selectValue
          ) {
            const selectValue = property.selectValue
            const optionIndex = extractOptionIndex(selectValue)
            if (
              optionIndex !== null &&
              optionIndex >= 0 &&
              optionIndex < prop.options.length
            ) {
              return (
                <Chip className="coloring-tonal">
                  {prop.options[optionIndex]}
                </Chip>
              )
            }
            return <span>{selectValue}</span>
          }

          if (
            prop.fieldType === FieldType.FieldTypeMultiSelect &&
            property.multiSelectValues &&
            property.multiSelectValues.length > 0
          ) {
            return (
              <div className="flex flex-wrap gap-1">
                {property.multiSelectValues
                  .filter((val): val is string => val !== null && val !== undefined)
                  .map((val, idx) => {
                    const optionIndex = extractOptionIndex(val)
                    const optionText =
                      optionIndex !== null &&
                      optionIndex >= 0 &&
                      optionIndex < prop.options.length
                        ? prop.options[optionIndex]
                        : val
                    return (
                      <Chip key={idx} className="coloring-tonal">
                        {optionText}
                      </Chip>
                    )
                  })}
              </div>
            )
          }

          if (
            property.textValue !== null &&
            property.textValue !== undefined
          ) {
            return <span>{property.textValue.toString()}</span>
          }

          if (
            property.numberValue !== null &&
            property.numberValue !== undefined
          ) {
            return <span>{property.numberValue.toString()}</span>
          }

          return <FillerCell className="min-h-8" />
        },
        meta: {
          columnType: ColumnType.Property,
          propertyDefinitionId: prop.id,
          fieldType: prop.fieldType,
          ...(getFilterFn() === 'tags' && {
            filterData: {
              tags: prop.options.map((opt, idx) => ({
                label: opt,
                tag: `${prop.id}-opt-${idx}`,
              })),
            },
          }),
        },
        minSize: 150,
        size: 200,
        maxSize: 300,
        filterFn: getFilterFn(),
      } as ColumnDef<TaskViewModel>
    })
  }, [propertyDefinitionsData, translation])

  const taskColumns = useMemo<ColumnDef<TaskViewModel>[]>(() => [
    {
      id: 'done',
      header: () => null,
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
        if (!patient) return <FillerCell/>

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
        if (!date) return <FillerCell/>
        return (
          <SmartDate date={date}/>
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

  return (
    <Table
      {...props}
      table={{
        data: tasks,
        columns: taskColumns,
        isUsingFillerRows: true,
        fillerRowCell: useCallback(() => (<FillerCell className="min-h-8"/>), []),
        onRowClick: useCallback((row: Row<TaskViewModel>) => onSelectTask(row.original.id), [onSelectTask]),
        initialState: {
          pagination: {
            pageSize: 25,
          }
        }
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