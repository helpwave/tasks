import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { ColumnDef, Row, ColumnFiltersState, PaginationState, SortingState, TableState, VisibilityState } from '@tanstack/react-table'
import type { GetOverviewDataQuery } from '@/api/gql/generated'
import { useCallback, useMemo, useEffect } from 'react'
import type { TableProps } from '@helpwave/hightide'
import { FillerCell, TableDisplay, TableProvider, Tooltip } from '@helpwave/hightide'
import { SmartDate } from '@/utils/date'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PropertyEntity } from '@/api/gql/generated'
import { usePropertyDefinitions } from '@/data'
import { createPropertyColumn } from '@/utils/propertyColumn'
import { useStateWithLocalStorage } from '@/hooks/useStateWithLocalStorage'

type PatientViewModel = GetOverviewDataQuery['recentPatients'][0]

const STORAGE_KEY_COLUMN_VISIBILITY = 'recent-patients-column-visibility'
const STORAGE_KEY_COLUMN_FILTERS = 'recent-patients-column-filters'
const STORAGE_KEY_COLUMN_SORTING = 'recent-patients-column-sorting'
const STORAGE_KEY_COLUMN_PAGINATION = 'recent-patients-column-pagination'

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

  const [pagination, setPagination] = useStateWithLocalStorage<PaginationState>({
    key: STORAGE_KEY_COLUMN_PAGINATION,
    defaultValue: {
      pageSize: 10,
      pageIndex: 0
    }
  })
  const [sorting, setSorting] = useStateWithLocalStorage<SortingState>({
    key: STORAGE_KEY_COLUMN_SORTING,
    defaultValue: []
  })
  const [filters, setFilters] = useStateWithLocalStorage<ColumnFiltersState>({
    key: STORAGE_KEY_COLUMN_FILTERS,
    defaultValue: []
  })
  const [columnVisibility, setColumnVisibility] = useStateWithLocalStorage<VisibilityState>({
    key: STORAGE_KEY_COLUMN_VISIBILITY,
    defaultValue: {}
  })

  useEffect(() => {
    if (propertyDefinitionsData?.propertyDefinitions) {
      const patientProperties = propertyDefinitionsData.propertyDefinitions.filter(
        def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
      )
      const propertyColumnIds = patientProperties.map(prop => `property_${prop.id}`)
      const hasPropertyColumnsInVisibility = propertyColumnIds.some(id => id in columnVisibility)

      if (!hasPropertyColumnsInVisibility && propertyColumnIds.length > 0) {
        const initialVisibility: VisibilityState = { ...columnVisibility }
        propertyColumnIds.forEach(id => {
          initialVisibility[id] = false
        })
        setColumnVisibility(initialVisibility)
      }
    }
  }, [propertyDefinitionsData, columnVisibility, setColumnVisibility])

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    const patientProperties = propertyDefinitionsData.propertyDefinitions.filter(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
    )

    return patientProperties.map(prop =>
      createPropertyColumn<PatientViewModel>(prop))
  }, [propertyDefinitionsData])

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
        if (!date) return <FillerCell/>
        return (
          <SmartDate date={date}/>
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
    pageSize: 10
  }), [pagination])

  return (
    <TableProvider
      data={patients}
      columns={patientColumns}
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
    >
      <div className="flex flex-col h-full gap-4" {...props}>
        <div className="flex-col-0">
          <span className="typography-title-lg">{translation('recentPatients')}</span>
          <span className="text-description">{translation('patientsUpdatedRecently')}</span>
        </div>
        <TableDisplay className="print-content" />
      </div>
    </TableProvider>
  )
}