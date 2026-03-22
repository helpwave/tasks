import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react'
import type { IdentifierFilterValue, FilterListItem, FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { Chip, FillerCell, HelpwaveLogo, LoadingContainer, SearchBar, ProgressIndicator, Tooltip, Drawer, TableProvider, TableDisplay, TableColumnSwitcher, TablePagination, IconButton, useLocale, FilterList, SortingList, Button, ExpansionIcon, Visibility } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import type { LocationType } from '@/api/gql/generated'
import { Sex, PatientState, type GetPatientsQuery, type TaskType, PropertyEntity, type FullTextSearchInput, FieldType } from '@/api/gql/generated'
import { usePropertyDefinitions, usePatientsPaginated, useRefreshingEntityIds } from '@/data'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/locations/LocationChips'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { getLocationNodesByKind, type LocationKindColumn } from '@/utils/location'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import type { ColumnDef, ColumnFiltersState, Row, SortingState, TableState } from '@tanstack/table-core'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { useStorageSyncedTableState } from '@/hooks/useTableState'
import { usePropertyColumnVisibility } from '@/hooks/usePropertyColumnVisibility'
import { columnFiltersToFilterInput, paginationStateToPaginationInput, sortingStateToSortInput } from '@/utils/tableStateToApi'
import { getPropertyFilterFn as getPropertyDatatype } from '@/utils/propertyFilterMapping'
import { UserSelectFilterPopUp } from './UserSelectFilterPopUp'
import { SaveViewDialog } from '@/components/views/SaveViewDialog'
import { SavedViewEntityType } from '@/api/gql/generated'
import { serializeColumnFiltersForView, serializeSortingForView, stringifyViewParameters } from '@/utils/viewDefinition'
import type { ViewParameters } from '@/utils/viewDefinition'

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

const LOCATION_KIND_HEADERS: Record<LocationKindColumn, string> = {
  CLINIC: 'locationClinic',
  WARD: 'locationWard',
  ROOM: 'locationRoom',
  BED: 'locationBed',
}

const ADMITTED_OR_WAITING_STATES: PatientState[] = [PatientState.Admitted, PatientState.Wait]

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
  /** Isolated storage namespace (e.g. per saved view). */
  storageKeyPrefix?: string,
  viewDefaultFilters?: ColumnFiltersState,
  viewDefaultSorting?: SortingState,
  viewDefaultSearchQuery?: string,
  readOnly?: boolean,
  hideSaveView?: boolean,
  onSavedViewCreated?: (id: string) => void,
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ initialPatientId, onInitialPatientOpened, acceptedStates: _acceptedStates, rootLocationIds, locationId, storageKeyPrefix, viewDefaultFilters, viewDefaultSorting, viewDefaultSearchQuery, readOnly: _readOnly, hideSaveView, onSavedViewCreated }, ref) => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const { selectedRootLocationIds } = useTasksContext()
  const { refreshingPatientIds } = useRefreshingEntityIds()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const effectiveRootLocationIds = rootLocationIds ?? selectedRootLocationIds
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState(viewDefaultSearchQuery ?? '')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)
  const [isShowFilters, setIsShowFilters] = useState(false)
  const [isShowSorting, setIsShowSorting] = useState(false)

  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
  } = useStorageSyncedTableState(storageKeyPrefix ?? 'patient-list', {
    defaultFilters: viewDefaultFilters,
    defaultSorting: viewDefaultSorting,
  })

  const baselineFilters = useMemo(() => viewDefaultFilters ?? [], [viewDefaultFilters])
  const baselineSorting = useMemo(() => viewDefaultSorting ?? [], [viewDefaultSorting])
  const baselineSearch = useMemo(() => viewDefaultSearchQuery ?? '', [viewDefaultSearchQuery])

  const filtersChanged = useMemo(
    () => serializeColumnFiltersForView(filters as ColumnFiltersState) !== serializeColumnFiltersForView(baselineFilters),
    [filters, baselineFilters]
  )
  const sortingChanged = useMemo(
    () => serializeSortingForView(sorting) !== serializeSortingForView(baselineSorting),
    [sorting, baselineSorting]
  )
  const searchChanged = useMemo(() => searchQuery !== baselineSearch, [searchQuery, baselineSearch])

  const [isSaveViewDialogOpen, setIsSaveViewDialogOpen] = useState(false)

  usePropertyColumnVisibility(
    propertyDefinitionsData,
    PropertyEntity.Patient,
    columnVisibility,
    setColumnVisibility
  )

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

  const apiFiltering = useMemo(() => columnFiltersToFilterInput(filters), [filters])
  const patientStates = useMemo(() => {
    const stateFilter = apiFiltering.find(
      f => f.column === 'state' &&
        (f.operator === 'TAGS_SINGLE_EQUALS' || f.operator === 'TAGS_SINGLE_CONTAINS') &&
        f.parameter?.searchTags != null &&
        f.parameter.searchTags.length > 0
    )
    if (!stateFilter?.parameter?.searchTags) return allPatientStates
    const allowed = new Set(allPatientStates as unknown as string[])
    const filtered = (stateFilter.parameter.searchTags as string[]).filter(s => allowed.has(s))
    return filtered.length > 0 ? (filtered as PatientState[]) : allPatientStates
  }, [apiFiltering, allPatientStates])

  const searchInput: FullTextSearchInput | undefined = searchQuery
    ? {
      searchText: searchQuery,
      includeProperties: true,
    }
    : undefined
  const apiSorting = useMemo(() => sortingStateToSortInput(sorting), [sorting])
  const apiPagination = useMemo(() => paginationStateToPaginationInput(pagination), [pagination])

  const lastTotalCountRef = useRef<number | undefined>(undefined)
  const { data: patientsData, refetch, totalCount, loading: patientsLoading } = usePatientsPaginated(
    {
      locationId: locationId || undefined,
      rootLocationIds: !locationId && effectiveRootLocationIds && effectiveRootLocationIds.length > 0 ? effectiveRootLocationIds : undefined,
      states: patientStates,
      search: searchInput,
    },
    {
      pagination: apiPagination,
      sorting: apiSorting.length > 0 ? apiSorting : undefined,
      filtering: apiFiltering.length > 0 ? apiFiltering : undefined,
    }
  )
  if (totalCount != null) lastTotalCountRef.current = totalCount
  const stableTotalCount = totalCount ?? lastTotalCountRef.current

  const patients: PatientViewModel[] = useMemo(() => {
    if (!patientsData || patientsData.length === 0) return []

    return patientsData.map(p => {
      const countForAggregate = ADMITTED_OR_WAITING_STATES.includes(p.state)
      return {
        id: p.id,
        name: p.name,
        firstname: p.firstname,
        lastname: p.lastname,
        birthdate: new Date(p.birthdate),
        sex: p.sex,
        state: p.state,
        position: p.position,
        openTasksCount: countForAggregate ? (p.tasks?.filter(t => !t.done).length ?? 0) : 0,
        closedTasksCount: countForAggregate ? (p.tasks?.filter(t => t.done).length ?? 0) : 0,
        tasks: [],
        properties: p.properties ?? [],
      }
    })
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

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(
    () => getPropertyColumnsForEntity<PatientViewModel>(propertyDefinitionsData, PropertyEntity.Patient, false),
    [propertyDefinitionsData]
  )

  const dateFormat = useMemo(() => Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }), [locale])

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
    },
    {
      id: 'state',
      header: translation('status'),
      accessorFn: ({ state }) => state,
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        return (
          <>
            <span className="print:block hidden">{translation('patientState', { state: row.original.state as string })}</span>
            <PatientStateChip state={row.original.state} className="print:hidden" />
          </>
        )
      },
      minSize: 120,
      size: 144,
      maxSize: 180,
    },
    {
      id: 'sex',
      header: translation('sex'),
      accessorFn: ({ sex }) => sex,
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const sex = row.original.sex
        const colorClass = sex === Sex.Male
          ? 'gender-male'
          : sex === Sex.Female
            ? 'gender-female'
            : 'gender-neutral'

        const label = {
          [Sex.Male]: translation('male'),
          [Sex.Female]: translation('female'),
          [Sex.Unknown]: translation('diverse'),
        }[sex] || sex

        return (
          <>
            <span className="print:block hidden">{label}</span>
            <Chip
              color={undefined}
              coloringStyle="tonal"
              size="sm"
              className={`${colorClass} uppercase font-semibold text-xs print:hidden`}
            >
              <span>{label}</span>
            </Chip>
          </>
        )
      },
      minSize: 160,
      size: 160,
      maxSize: 200,
    },
    {
      id: 'position',
      header: translation('location'),
      accessorFn: ({ position }: PatientViewModel) => position?.title,
      cell: ({ row }: { row: Row<PatientViewModel> }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        return (
          <>
            <span className="print:block hidden">{row.original.position?.title}</span>
            <LocationChipsBySetting locations={row.original.position ? [row.original.position] : []} small className="print:hidden" />
          </>
        )
      },
      minSize: 200,
      size: 260,
      maxSize: 320,
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
        return (
          <>
            <span className="print:block hidden">{node?.title}</span>
            <LocationChips locations={node ? [{ id: node.id, title: node.title, kind: node.kind as LocationType }] : []} small className="print:hidden" />
          </>
        )
      },
      minSize: 160,
      size: 220,
      maxSize: 300,
    })),
    {
      id: 'birthdate',
      header: translation('birthdate'),
      accessorKey: 'birthdate',
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id))
          return rowLoadingCell

        const now = new Date()
        const birthdate = row.original.birthdate
        let years = now.getFullYear() - birthdate.getFullYear()
        const monthDiff = now.getMonth() - birthdate.getMonth()
        const dayDiff = now.getDate() - birthdate.getDate()

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          years--
        }

        return (
          <span>
            {dateFormat.format(row.original.birthdate) + ' (' + translation('nYears', { years }) + ')'}
          </span>
        )
      },
      minSize: 200,
      size: 200,
      maxSize: 200,
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

        return (
          <Tooltip
            tooltip={(
              <div className="flex-col-0">
                <span>{`${translation('openTasks')}: ${openTasksCount}`}</span>
                <span>{`${translation('closedTasks')}: ${closedTasksCount}`}</span>
              </div>
            )}
            alignment="top"
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
  ], [translation, patientPropertyColumns, refreshingPatientIds, rowLoadingCell, dateFormat])

  const availableFilters: FilterListItem[] = useMemo(() => [
    {
      id: 'name',
      label: translation('name'),
      dataType: 'text',
      tags: [],
    },
    {
      id: 'state',
      label: translation('status'),
      dataType: 'singleTag',
      tags: allPatientStates.map(state => ({ label: translation('patientState', { state: state as string }), tag: state })),
    },
    {
      id: 'sex',
      label: translation('sex'),
      dataType: 'singleTag',
      tags: [
        { label: translation('male'), tag: Sex.Male },
        { label: translation('female'), tag: Sex.Female },
        { label: translation('diverse'), tag: Sex.Unknown },
      ],
    },
    ...(['CLINIC', 'WARD', 'ROOM', 'BED'] as const).map((kind): FilterListItem => ({
      id: `location-${kind}`,
      label: translation(LOCATION_KIND_HEADERS[kind] as 'locationClinic' | 'locationWard' | 'locationRoom' | 'locationBed'),
      dataType: 'text',
      tags: [],
    })),
    {
      id: 'birthdate',
      label: translation('birthdate'),
      dataType: 'date',
      tags: [],
    },
    {
      id: 'tasks',
      label: translation('tasks'),
      dataType: 'number',
      tags: [],
    },
    ...propertyDefinitionsData?.propertyDefinitions.map(def => {
      const dataType = getPropertyDatatype(def.fieldType)
      return {
        id:  `property_${def.id}`,
        label: def.name,
        dataType,
        tags: def.options.map((opt, idx) => ({
          label: opt,
          tag: `${def.id}-opt-${idx}`,
        })),
        popUpBuilder: def.fieldType === FieldType.FieldTypeUser ? (props: FilterListPopUpBuilderProps) => (<UserSelectFilterPopUp {...props}/>) : undefined,
      }
    }) ?? [],
  ], [allPatientStates, propertyDefinitionsData?.propertyDefinitions, translation])

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
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={setColumnVisibility}
      onPaginationChange={setPagination}
      pageCount={stableTotalCount != null ? Math.ceil(stableTotalCount / pagination.pageSize) : -1}

      manualPagination={true}
      manualSorting={true}
      manualFiltering={true}

      enableColumnFilters={false}
      enableSorting={false}
      enableColumnPinning={false}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex-col-2 w-full">
          <div className="flex-row-8 justify-between w-full">
            <div className="flex flex-wrap gap-2 items-center">
              <SearchBar
                placeholder={translation('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={() => null}
                containerProps={{ className: 'max-w-80' }}
              />
              <TableColumnSwitcher />
              <Button
                onClick={() => setIsShowFilters(!isShowFilters)}
                color="neutral"
                className="font-semibold element"
              >
                {translation('filter') + ` (${filters.length})`}
                <ExpansionIcon isExpanded={isShowFilters} className="size-5"/>
              </Button>
              <Button
                onClick={() => setIsShowSorting(!isShowSorting)}
                color="neutral"
                className="font-semibold"
              >
                {translation('sorting') + ` (${sorting.length})`}
                <ExpansionIcon isExpanded={isShowSorting} className="size-5"/>
              </Button>
              <Visibility isVisible={!hideSaveView && (filtersChanged || sortingChanged || searchChanged)}>
                <Button color="primary" onClick={() => setIsSaveViewDialogOpen(true)}>
                  {translation('saveView')}
                </Button>
              </Visibility>
              {/* TODO Offer undo in case this is already a fast access and add a update button */}
            </div>
            <IconButton
              tooltip={translation('addPatient')}
              onClick={() => {
                setSelectedPatient(undefined)
                setIsPanelOpen(true)
              }}
              color="primary"
            >
              <PlusIcon />
            </IconButton>
          </div>
          {isShowFilters && (
            <FilterList
              value={filters as IdentifierFilterValue[]}
              onValueChange={setFilters}
              availableItems={availableFilters}
            />
          )}
          {isShowSorting && (
            <SortingList
              sorting={sorting}
              onSortingChange={setSorting}
              availableItems={availableFilters}
            />
          )}
        </div>
        <div className="relative print:static">
          {patientsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 rounded-lg min-h-48">
              <HelpwaveLogo animate="loading" color="currentColor" height={64} width={64} />
            </div>
          )}
          <TableDisplay className="print-content"/>
          {totalCount != null && (
            <TablePagination
              allowChangingPageSize={true}
              pageSizeOptions={[10, 25, 50]}
              className="mt-2"
            />
          )}
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
        <SaveViewDialog
          isOpen={isSaveViewDialogOpen}
          onClose={() => setIsSaveViewDialogOpen(false)}
          baseEntityType={SavedViewEntityType.Patient}
          filterDefinition={serializeColumnFiltersForView(filters as ColumnFiltersState)}
          sortDefinition={serializeSortingForView(sorting)}
          parameters={stringifyViewParameters({
            rootLocationIds: effectiveRootLocationIds ?? undefined,
            locationId: locationId ?? undefined,
            searchQuery: searchQuery || undefined,
          } satisfies ViewParameters)}
          onCreated={onSavedViewCreated}
        />
      </div>
    </TableProvider>
  )
})

PatientList.displayName = 'PatientList'
