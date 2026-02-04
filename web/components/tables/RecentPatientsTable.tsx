import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row, TableState } from '@tanstack/react-table'
import type { GetOverviewDataQuery } from '@/api/gql/generated'
import { useCallback, useMemo } from 'react'
import type { TableProps } from '@helpwave/hightide'
import { FillerCell, TableDisplay, TableProvider, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PropertyEntity } from '@/api/gql/generated'
import { usePropertyDefinitions } from '@/data'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { useTableState } from '@/hooks/useTableState'
import { usePropertyColumnVisibility } from '@/hooks/usePropertyColumnVisibility'

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
  } = useTableState('recent-patients')

  usePropertyColumnVisibility(
    propertyDefinitionsData,
    PropertyEntity.Patient,
    columnVisibility,
    setColumnVisibility
  )

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(
    () => getPropertyColumnsForEntity<PatientViewModel>(propertyDefinitionsData, PropertyEntity.Patient),
    [propertyDefinitionsData]
  )

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
      cell: ({ row }: { row: Row<PatientViewModel> }) => (
        <LocationChipsBySetting
          locations={row.original.position ? [row.original.position] : []}
          small
          className="min-h-8"
          placeholderProps={{ className: 'min-h-8 block' }}
        />
      ),
      minSize: 200,
      size: 260,
      maxSize: 320,
      filterFn: 'text' as const,
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
        if (!date) return <FillerCell />
        return (
          <SmartDate date={date} />
        )
      },
      minSize: 200,
      size: 200,
      maxSize: 200,
      filterFn: 'date',
    },
    ...patientPropertyColumns,
  ], [translation, patientPropertyColumns])

  const fillerRowCell = useCallback(() => <FillerCell className="min-h-8" />, [])
  const onRowClick = useCallback((row: Row<PatientViewModel>) => onSelectPatient(row.original.id), [onSelectPatient])

  const fixedPagination = useMemo(() => ({
    ...pagination,
    pageSize: 5
  }), [pagination])

  return (
    <div className="mt-2">
      <TableProvider
        data={patients}
        columns={patientColumns}
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
      >
        <div className="flex flex-col h-full gap-4 w-full min-w-0" {...props}>
          <div className="flex-col-0">
            <span className="typography-title-lg">{translation('recentPatients')}</span>
            <span className="text-description">{translation('patientsUpdatedRecently')}</span>
          </div>
          <div className="w-full min-w-0 overflow-x-auto mt-4">
            <TableDisplay className="min-w-full" />
          </div>
        </div>
      </TableProvider>
    </div>
  )
}
