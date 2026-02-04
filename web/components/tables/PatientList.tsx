import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react'
import { Chip, FillerCell, Button, HelpwaveLogo, LoadingContainer, SearchBar, ProgressIndicator, Tooltip, Drawer, TableProvider, TableDisplay, TableColumnSwitcher } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { Sex, PatientState, type GetPatientsQuery, type TaskType, PropertyEntity, type FullTextSearchInput, type LocationType } from '@/api/gql/generated'
import { usePropertyDefinitions, usePatientsPaginated, useRefreshingEntityIds } from '@/data'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { SmartDate } from '@/utils/date'
import { LocationChips } from '@/components/patients/LocationChips'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { getLocationNodesByKind, type LocationKindColumn } from '@/utils/location'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import type { ColumnDef, Row, ColumnFiltersState, PaginationState, SortingState, TableState, VisibilityState } from '@tanstack/table-core'
import { createPropertyColumn } from '@/utils/propertyColumn'
import { useStateWithLocalStorage } from '@/hooks/useStateWithLocalStorage'
import { TABLE_PAGE_SIZE } from '@/utils/tableConfig'

export type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  position: GetPatientsQuery['patients'][0]['position'],
  openTasksCount: number,
  closedTasksCount: number,
  birthdate: Date,
  sex: Sex,
  state: PatientState,
  tasks: TaskType[],
  properties?: GetPatientsQuery['patients'][0]['properties'],
}

const STORAGE_KEY_COLUMN_VISIBILITY = 'patient-list-column-visibility'
const STORAGE_KEY_COLUMN_FILTERS = 'patient-list-column-filters'
const STORAGE_KEY_COLUMN_SORTING = 'patient-list-column-sorting'
const STORAGE_KEY_COLUMN_PAGINATION = 'patient-list-column-pagination'

const LOCATION_KIND_HEADERS: Record<LocationKindColumn, string> = {
  CLINIC: 'locationClinic',
  WARD: 'locationWard',
  ROOM: 'locationRoom',
  BED: 'locationBed',
}

export type PatientListRef = {
  openCreate: () => void,
  openPatient: (patientId: string) => void,
}

type PatientListProps = {
  initialPatientId?: string,
  onInitialPatientOpened?: () => void,
  acceptedStates?: PatientState[],
  rootLocationIds?: string[],
  locationId?: string,
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ initialPatientId, onInitialPatientOpened, acceptedStates: _acceptedStates, rootLocationIds, locationId }, ref) => {
  const translation = useTasksTranslation()
  const { selectedRootLocationIds } = useTasksContext()
  const { refreshingPatientIds } = useRefreshingEntityIds()
  const effectiveRootLocationIds = rootLocationIds ?? selectedRootLocationIds
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)

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

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])
  const patientStates = allPatientStates

  const searchInput: FullTextSearchInput | undefined = searchQuery
    ? {
      searchText: searchQuery,
      includeProperties: true,
    }
    : undefined

  const { data: patientsData, refetch, totalCount, loading: patientsLoading } = usePatientsPaginated(
    {
      locationId: locationId || undefined,
      rootLocationIds: !locationId && effectiveRootLocationIds && effectiveRootLocationIds.length > 0 ? effectiveRootLocationIds : undefined,
      states: patientStates,
      search: searchInput,
    },
    { pageSize: TABLE_PAGE_SIZE }
  )

  const { data: propertyDefinitionsData } = usePropertyDefinitions()

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

  const patients: PatientViewModel[] = useMemo(() => {
    if (!patientsData || patientsData.length === 0) return []

    return patientsData.map(p => ({
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      state: p.state,
      position: p.position,
      openTasksCount: p.tasks?.filter(t => !t.done).length ?? 0,
      closedTasksCount: p.tasks?.filter(t => t.done).length ?? 0,
      tasks: [],
      properties: p.properties ?? [],
    }))
  }, [patientsData])

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      setSelectedPatient(undefined)
      setIsPanelOpen(true)
    },
    openPatient: (patientId: string) => {
      const patient = patients.find(p => p.id === patientId)
      if (patient) {
        setSelectedPatient(patient)
        setIsPanelOpen(true)
      }
    }
  }), [patients])

  useEffect(() => {
    if (initialPatientId && openedPatientId !== initialPatientId) {
      const patient = patients.find(p => p.id === initialPatientId)
      if (patient) {
        setSelectedPatient(patient)
      }
      setIsPanelOpen(true)
      setOpenedPatientId(initialPatientId)
      onInitialPatientOpened?.()
    }
  }, [initialPatientId, patients, openedPatientId, onInitialPatientOpened])

  const handleEdit = useCallback((patient: PatientViewModel) => {
    setSelectedPatient(patient)
    setIsPanelOpen(true)
  }, [])

  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedPatient(undefined)
    setOpenedPatientId(null)
  }

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []

    const patientProperties = propertyDefinitionsData.propertyDefinitions.filter(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
    )

    return patientProperties.map(prop =>
      createPropertyColumn<PatientViewModel>(prop))
  }, [propertyDefinitionsData])

  const rowLoadingCell = useMemo(() => <LoadingContainer className="w-full min-h-8" />, [])

  const columns = useMemo<ColumnDef<PatientViewModel>[]>(() => [
    {
      id: 'name',
      header: translation('name'),
      accessorKey: 'name',
      cell: ({ row }) => (refreshingPatientIds.has(row.original.id) ? rowLoadingCell : row.original.name),
      minSize: 200,
      size: 250,
      maxSize: 300,
      filterFn: 'text',
    },
    {
      id: 'state',
      header: translation('status'),
      accessorFn: ({ state }) => [state],
      cell: ({ row }) =>
        refreshingPatientIds.has(row.original.id) ? rowLoadingCell : <PatientStateChip state={row.original.state} />,
      minSize: 120,
      size: 144,
      maxSize: 180,
      filterFn: 'tags',
      meta: {
        filterData: {
          tags: allPatientStates.map(state => ({ label: translation('patientState', { state: state as string }), tag: state })),
        }
      }
    },
    {
      id: 'sex',
      header: translation('sex'),
      accessorFn: ({ sex }) => [sex],
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const sex = row.original.sex
        const colorClass = sex === Sex.Male
          ? '!gender-male'
          : sex === Sex.Female
            ? '!gender-female'
            : 'bg-gray-600 text-white'

        const label = {
          [Sex.Male]: translation('male'),
          [Sex.Female]: translation('female'),
          [Sex.Unknown]: translation('diverse'),
        }[sex] || sex

        return (
          <Chip
            color={sex === Sex.Unknown ? 'neutral' : undefined}
            coloringStyle="tonal"
            size="sm"
            className={`${colorClass} font-[var(--font-space-grotesk)] uppercase text-xs`}
          >
            <span>{label}</span>
          </Chip>
        )
      },
      minSize: 160,
      size: 160,
      maxSize: 200,
      filterFn: 'tags',
      meta: {
        filterData: {
          tags: [
            { label: translation('male'), tag: Sex.Male },
            { label: translation('female'), tag: Sex.Female },
            { label: translation('diverse'), tag: Sex.Unknown },
          ],
        }
      }
    },
    {
      id: 'position',
      header: translation('location'),
      accessorFn: ({ position }: PatientViewModel) => position?.title,
      cell: ({ row }: { row: Row<PatientViewModel> }) =>
        refreshingPatientIds.has(row.original.id) ? rowLoadingCell : (
          <LocationChipsBySetting locations={row.original.position ? [row.original.position] : []} small />
        ),
      minSize: 200,
      size: 260,
      maxSize: 320,
      filterFn: 'text' as const,
    },
    ...(['CLINIC', 'WARD', 'ROOM', 'BED'] as const).map((kind): ColumnDef<PatientViewModel> => ({
      id: `location-${kind}`,
      header: translation(LOCATION_KIND_HEADERS[kind] as 'locationClinic' | 'locationWard' | 'locationRoom' | 'locationBed'),
      accessorFn: (row: PatientViewModel) => {
        const byKind = getLocationNodesByKind(row.position ?? null)
        return byKind[kind]?.title ?? ''
      },
      cell: ({ row }: { row: Row<PatientViewModel> }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const byKind = getLocationNodesByKind(row.original.position ?? null)
        const node = byKind[kind]
        return <LocationChips locations={node ? [{ id: node.id, title: node.title, kind: node.kind as LocationType }] : []} small />
      },
      minSize: 160,
      size: 220,
      maxSize: 300,
      filterFn: 'text' as const,
    })),
    {
      id: 'birthdate',
      header: translation('birthdate'),
      accessorKey: 'birthdate',
      cell: ({ row }) =>
        refreshingPatientIds.has(row.original.id) ? rowLoadingCell : (
          <SmartDate date={row.original.birthdate} showTime={false} />
        ),
      minSize: 200,
      size: 200,
      maxSize: 200,
      filterFn: 'date' as const,
    },
    {
      id: 'tasks',
      header: translation('tasks'),
      accessorFn: ({ openTasksCount, closedTasksCount }) => {
        const total = openTasksCount + closedTasksCount
        return total === 0 ? 0 : closedTasksCount / total
      },
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const { openTasksCount, closedTasksCount } = row.original
        const total = openTasksCount + closedTasksCount
        const progress = total === 0 ? 0 : closedTasksCount / total
        const tooltipText = `${translation('openTasks')}: ${openTasksCount}\n${translation('closedTasks')}: ${closedTasksCount}`

        return (
          <Tooltip
            tooltip={tooltipText}
            position="top"
            tooltipClassName="whitespace-pre-line"
          >
            <div className="w-full max-w-[80px]">
              <ProgressIndicator progress={progress} rotation={-90} />
            </div>
          </Tooltip>
        )
      },
      minSize: 150,
      size: 150,
      maxSize: 200,
    },
    ...patientPropertyColumns.map((col) => ({
      ...col,
      cell: col.cell
        ? (params: { row: { original: PatientViewModel } }) =>
          refreshingPatientIds.has(params.row.original.id) ? rowLoadingCell : (col.cell as (p: unknown) => React.ReactNode)(params)
        : undefined,
    })),
  ], [allPatientStates, translation, patientPropertyColumns, refreshingPatientIds, rowLoadingCell])

  const onRowClick = useCallback((row: Row<PatientViewModel>) => handleEdit(row.original), [handleEdit])
  const fillerRowCell = useCallback(() => (<FillerCell className="min-h-8" />), [])

  return (
    <TableProvider
      data={patients}
      columns={columns}
      fillerRowCell={fillerRowCell}
      onRowClick={onRowClick}
      initialState={{
        pagination: {
          pageSize: 10,
        }
      }}
      state={{
        columnVisibility,
        pagination,
        sorting,
        columnFilters: filters,
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={setColumnVisibility}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onColumnFiltersChange={setFilters}
      enableMultiSort={true}
      pageCount={totalCount ? Math.ceil(totalCount / pagination.pageSize) : undefined}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <div className="flex-row-2 items-center">
            <SearchBar
              placeholder={translation('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => null}
            />
            <TableColumnSwitcher />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto sm:ml-auto">
            <Tooltip tooltip={translation('addPatient')} position="top">
              <Button
                onClick={() => {
                  setSelectedPatient(undefined)
                  setIsPanelOpen(true)
                }}
                layout="icon"
              >
                <PlusIcon />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="relative">
          {patientsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 rounded-lg min-h-48">
              <HelpwaveLogo animate="loading" color="currentColor" height={64} width={64} />
            </div>
          )}
          <TableDisplay />
        </div>
        <Drawer
          isOpen={isPanelOpen}
          onClose={handleClose}
          alignment="right"
          titleElement={!selectedPatient && !openedPatientId ? translation('addPatient') : translation('editPatient')}
          description={undefined}
        >
          <PatientDetailView
            patientId={selectedPatient?.id ?? openedPatientId ?? undefined}
            onClose={handleClose}
            onSuccess={refetch}
          />
        </Drawer>
      </div>
    </TableProvider>
  )
})

PatientList.displayName = 'PatientList'
