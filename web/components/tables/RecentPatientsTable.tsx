import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { GetOverviewDataQuery } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import type { TableProps } from '@helpwave/hightide'
import { FillerCell, Table, TableColumnSwitcher, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'

type PatientViewModel = GetOverviewDataQuery['recentPatients'][0]

export interface RecentPatientsTableProps extends Omit<TableProps<PatientViewModel>, 'table'> {
  patients: PatientViewModel[],
  onSelectPatient: (id: string) => void,
}

export const RecentPatientsTable = ({
  patients,
  onSelectPatient,
  ...props
}: RecentPatientsTableProps) => {
  const translation = useTasksTranslation()
  const patientColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      cell: ({ row }) => {
        return (
          <Tooltip tooltip={row.original.name} containerClassName="overflow-hidden w-fit max-w-full !block">
            <span className="truncate block">{row.original.name}</span>
          </Tooltip>
        )
      },
      minSize: 160,
      filterFn: 'text',
    },
    {
      id: 'location',
      header: translation('location'),
      accessorKey: 'position',
      cell: ({ row }) => (
        <LocationChips
          locations={row.original.position ? [row.original.position] : []}
          small
          className="min-h-8"
          placeholderProps={{ className: 'min-h-8 block' }}
        />
      ),
      minSize: 200,
      filterFn: 'text',
    },
    {
      id: 'updated',
      header: translation('updated'),
      accessorFn: (value) => {
        const tasks = value.tasks || []
        const updateDates = tasks
          .map(t => t.updateDate ? new Date(t.updateDate) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())
        return updateDates[0]
      },
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
  ], [translation])

  return (
    <Table
      {...props}
      table={{
        data: patients,
        columns: patientColumns,
        fillerRowCell: useCallback(() => (<FillerCell className="min-h-8"/>), []),
        onRowClick: useCallback((row: Row<PatientViewModel>) => onSelectPatient(row.original.id), [onSelectPatient]),
        initialState: {
          pagination: {
            pageSize: 25,
          }
        }
      }}
      header={(
        <div className="flex-row-4 justify-between items-center">
          <div className="flex-col-0">
            <span className="typography-title-lg">{translation('recentPatients')}</span>
            <span className="text-description">{translation('patientsUpdatedRecently')}</span>
          </div>
          <div>
            <TableColumnSwitcher/>
          </div>
        </div>
      )}
    />
  )
}