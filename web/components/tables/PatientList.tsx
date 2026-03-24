import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react'
import { useMutation } from '@apollo/client/react'
import type { IdentifierFilterValue, FilterListItem, FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { Chip, FillerCell, HelpwaveLogo, LoadingContainer, SearchBar, ProgressIndicator, Tooltip, Drawer, TableProvider, TableDisplay, TableColumnSwitcher, TablePagination, IconButton, useLocale, FilterList, SortingList, Button, ExpansionIcon, Visibility } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import type { LocationType } from '@/api/gql/generated'
import { Sex, PatientState, type GetPatientsQuery, type TaskType, PropertyEntity, FieldType } from '@/api/gql/generated'
import { usePropertyDefinitions, usePatientsPaginated, useQueryableFields, useRefreshingEntityIds } from '@/data'
import { PatientDetailView } from '@/components/patients/PatientDetailView'
import { LocationChips } from '@/components/locations/LocationChips'
import { LocationChipsBySetting } from '@/components/patients/LocationChipsBySetting'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { getLocationNodesByKind, type LocationKindColumn } from '@/utils/location'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useTasksContext } from '@/hooks/useTasksContext'
import type { ColumnDef, ColumnFiltersState, ColumnOrderState, PaginationState, Row, SortingState, TableState, VisibilityState } from '@tanstack/table-core'
import { getPropertyColumnsForEntity } from '@/utils/propertyColumn'
import { getPropertyColumnIds, useColumnVisibilityWithPropertyDefaults } from '@/hooks/usePropertyColumnVisibility'
import { columnFiltersToQueryFilterClauses, paginationStateToPaginationInput, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { queryableFieldsToFilterListItems, queryableFieldsToSortingListItems } from '@/utils/queryableFilterList'
import { getPropertyFilterFn as getPropertyDatatype } from '@/utils/propertyFilterMapping'
import { UserSelectFilterPopUp } from './UserSelectFilterPopUp'
import { SaveViewDialog } from '@/components/views/SaveViewDialog'
import { SaveViewActionsMenu } from '@/components/views/SaveViewActionsMenu'
import {
  MySavedViewsDocument,
  SavedViewDocument,
  SavedViewEntityType,
  UpdateSavedViewDocument,
  type UpdateSavedViewMutation,
  type UpdateSavedViewMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { replaceSavedViewInMySavedViewsCache } from '@/utils/savedViewsCache'
import { useDeferredColumnOrderChange } from '@/hooks/useDeferredColumnOrderChange'
import { columnIdsFromColumnDefs, sanitizeColumnOrderForKnownColumns } from '@/utils/columnOrder'
import {
  hasActiveLocationFilter,
  normalizedColumnOrderForViewCompare,
  normalizedVisibilityForViewCompare,
  serializeColumnFiltersForView,
  serializeSortingForView,
  stringifyViewParameters,
  tableViewStateMatchesBaseline
} from '@/utils/viewDefinition'
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
  viewDefaultFilters?: ColumnFiltersState,
  viewDefaultSorting?: SortingState,
  viewDefaultSearchQuery?: string,
  viewDefaultColumnVisibility?: VisibilityState,
  viewDefaultColumnOrder?: ColumnOrderState,
  readOnly?: boolean,
  hideSaveView?: boolean,
  /** When set (e.g. on `/view/:id`), overwrite updates this saved view. */
  savedViewId?: string,
  onSavedViewCreated?: (id: string) => void,
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ initialPatientId, onInitialPatientOpened, acceptedStates: _acceptedStates, rootLocationIds, locationId, viewDefaultFilters, viewDefaultSorting, viewDefaultSearchQuery, viewDefaultColumnVisibility, viewDefaultColumnOrder, readOnly: _readOnly, hideSaveView, savedViewId, onSavedViewCreated }, ref) => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const { selectedRootLocationIds } = useTasksContext()
  const { refreshingPatientIds } = useRefreshingEntityIds()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const { data: queryableFieldsData } = useQueryableFields('Patient')
  const effectiveRootLocationIds = rootLocationIds ?? selectedRootLocationIds
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState(viewDefaultSearchQuery ?? '')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)
  const [isShowFilters, setIsShowFilters] = useState(false)
  const [isShowSorting, setIsShowSorting] = useState(false)

  const [pagination, setPagination] = useState<PaginationState>({ pageSize: 10, pageIndex: 0 })
  const [sorting, setSorting] = useState<SortingState>(() => viewDefaultSorting ?? [])
  const [filters, setFilters] = useState<ColumnFiltersState>(() => viewDefaultFilters ?? [])
  const [columnVisibility, setColumnVisibilityRaw] = useState<VisibilityState>(() => viewDefaultColumnVisibility ?? {})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => viewDefaultColumnOrder ?? [])

  const setColumnVisibility = useColumnVisibilityWithPropertyDefaults(
    propertyDefinitionsData,
    PropertyEntity.Patient,
    setColumnVisibilityRaw
  )

  const baselineFilters = useMemo(() => viewDefaultFilters ?? [], [viewDefaultFilters])
  const baselineSorting = useMemo(() => viewDefaultSorting ?? [], [viewDefaultSorting])
  const baselineSearch = useMemo(() => viewDefaultSearchQuery ?? '', [viewDefaultSearchQuery])
  const baselineColumnVisibility = useMemo(() => viewDefaultColumnVisibility ?? {}, [viewDefaultColumnVisibility])
  const baselineColumnOrder = useMemo(() => viewDefaultColumnOrder ?? [], [viewDefaultColumnOrder])

  const hasLocationFilter = useMemo(
    () => hasActiveLocationFilter(filters),
    [filters]
  )

  const propertyColumnIds = useMemo(
    () => getPropertyColumnIds(propertyDefinitionsData, PropertyEntity.Patient),
    [propertyDefinitionsData]
  )

  const persistedSavedViewContentKey = useMemo(
    () =>
      `${serializeColumnFiltersForView(baselineFilters)}|${serializeSortingForView(baselineSorting)}|${baselineSearch}|${normalizedVisibilityForViewCompare(baselineColumnVisibility)}|${normalizedColumnOrderForViewCompare(baselineColumnOrder)}`,
    [baselineFilters, baselineSorting, baselineSearch, baselineColumnVisibility, baselineColumnOrder]
  )

  useEffect(() => {
    if (!savedViewId) {
      return
    }
    setFilters(baselineFilters)
    setSorting(baselineSorting)
    setSearchQuery(baselineSearch)
    setColumnVisibility(baselineColumnVisibility)
    setColumnOrder(baselineColumnOrder)
    setPagination({ pageSize: 10, pageIndex: 0 })
  }, [
    savedViewId,
    persistedSavedViewContentKey,
    baselineFilters,
    baselineSorting,
    baselineSearch,
    baselineColumnVisibility,
    baselineColumnOrder,
    setColumnVisibility,
  ])

  const [isSaveViewDialogOpen, setIsSaveViewDialogOpen] = useState(false)

  const [updateSavedView, { loading: overwriteLoading }] = useMutation<
    UpdateSavedViewMutation,
    UpdateSavedViewMutationVariables
  >(getParsedDocument(UpdateSavedViewDocument), {
    awaitRefetchQueries: true,
    refetchQueries: savedViewId
      ? [
        { query: getParsedDocument(SavedViewDocument), variables: { id: savedViewId } },
        { query: getParsedDocument(MySavedViewsDocument) },
      ]
      : [{ query: getParsedDocument(MySavedViewsDocument) }],
    update(cache, { data }) {
      const view = data?.updateSavedView
      if (view) {
        replaceSavedViewInMySavedViewsCache(cache, view)
      }
    },
  })

  const handleDiscardViewChanges = useCallback(() => {
    setFilters(baselineFilters)
    setSorting(baselineSorting)
    setSearchQuery(baselineSearch)
    setColumnVisibility(baselineColumnVisibility)
    setColumnOrder(baselineColumnOrder)
  }, [
    baselineFilters,
    baselineSorting,
    baselineSearch,
    baselineColumnVisibility,
    baselineColumnOrder,
    setFilters,
    setSorting,
    setSearchQuery,
    setColumnVisibility,
    setColumnOrder,
  ])

  const handleOverwriteSavedView = useCallback(async () => {
    if (!savedViewId) return
    await updateSavedView({
      variables: {
        id: savedViewId,
        data: {
          filterDefinition: serializeColumnFiltersForView(filters as ColumnFiltersState),
          sortDefinition: serializeSortingForView(sorting),
          parameters: stringifyViewParameters({
            rootLocationIds: effectiveRootLocationIds ?? undefined,
            locationId: hasLocationFilter ? undefined : (locationId ?? undefined),
            searchQuery: searchQuery || undefined,
            columnVisibility,
            columnOrder,
          } satisfies ViewParameters),
        },
      },
    })
  }, [
    savedViewId,
    updateSavedView,
    filters,
    sorting,
    effectiveRootLocationIds,
    hasLocationFilter,
    locationId,
    searchQuery,
    columnVisibility,
    columnOrder,
  ])

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const patientStates = useMemo(() => {
    const stateFilter = apiFilters.find(f => f.fieldKey === 'state')
    if (!stateFilter?.value) return allPatientStates
    const raw = stateFilter.value.stringValues?.length
      ? stateFilter.value.stringValues
      : stateFilter.value.stringValue
        ? [stateFilter.value.stringValue]
        : []
    if (raw.length === 0) return allPatientStates
    const allowed = new Set(allPatientStates as unknown as string[])
    const filtered = raw.filter(s => allowed.has(s))
    return filtered.length > 0 ? (filtered as PatientState[]) : allPatientStates
  }, [apiFilters, allPatientStates])

  const searchInput = searchQuery
    ? {
      searchText: searchQuery,
      includeProperties: true,
    }
    : undefined
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])
  const apiPagination = useMemo(() => paginationStateToPaginationInput(pagination), [pagination])

  const lastTotalCountRef = useRef<number | undefined>(undefined)
  const { data: patientsData, refetch, totalCount, loading: patientsLoading } = usePatientsPaginated(
    {
      locationId: hasLocationFilter ? undefined : (locationId || undefined),
      rootLocationIds: hasLocationFilter || locationId
        ? undefined
        : (effectiveRootLocationIds && effectiveRootLocationIds.length > 0 ? effectiveRootLocationIds : undefined),
      states: patientStates,
    },
    {
      pagination: apiPagination,
      sorts: apiSorting.length > 0 ? apiSorting : undefined,
      filters: apiFilters.length > 0 ? apiFilters : undefined,
      search: searchInput,
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

  const propertyFieldTypeByDefId = useMemo(
    () => new Map(propertyDefinitionsData?.propertyDefinitions.map(d => [d.id, d.fieldType]) ?? []),
    [propertyDefinitionsData]
  )

  const availableFilters: FilterListItem[] = useMemo(() => {
    const raw = queryableFieldsData?.queryableFields
    if (raw?.length) {
      return queryableFieldsToFilterListItems(raw, propertyFieldTypeByDefId)
    }
    return [
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
          id: `property_${def.id}`,
          label: def.name,
          dataType,
          tags: def.options.map((opt, idx) => ({
            label: opt,
            tag: `${def.id}-opt-${idx}`,
          })),
          popUpBuilder: def.fieldType === FieldType.FieldTypeUser ? (props: FilterListPopUpBuilderProps) => (<UserSelectFilterPopUp {...props} />) : undefined,
        }
      }) ?? [],
    ]
  }, [queryableFieldsData?.queryableFields, propertyFieldTypeByDefId, translation, allPatientStates, propertyDefinitionsData?.propertyDefinitions])

  const availableSortItems = useMemo(() => {
    const raw = queryableFieldsData?.queryableFields
    if (raw?.length) {
      return queryableFieldsToSortingListItems(raw)
    }
    return availableFilters.map(({ id, label, dataType }) => ({ id, label, dataType }))
  }, [queryableFieldsData?.queryableFields, availableFilters])

  const knownColumnIdsOrdered = useMemo(
    () => columnIdsFromColumnDefs(columns),
    [columns]
  )

  const sanitizedColumnOrder = useMemo(
    () => sanitizeColumnOrderForKnownColumns(columnOrder, knownColumnIdsOrdered),
    [columnOrder, knownColumnIdsOrdered]
  )

  const sanitizedBaselineColumnOrder = useMemo(
    () => sanitizeColumnOrderForKnownColumns(baselineColumnOrder, knownColumnIdsOrdered),
    [baselineColumnOrder, knownColumnIdsOrdered]
  )

  const viewMatchesBaseline = useMemo(
    () => tableViewStateMatchesBaseline({
      filters: filters as ColumnFiltersState,
      baselineFilters,
      sorting,
      baselineSorting,
      searchQuery,
      baselineSearch,
      columnVisibility,
      baselineColumnVisibility,
      columnOrder: sanitizedColumnOrder,
      baselineColumnOrder: sanitizedBaselineColumnOrder,
      propertyColumnIds,
    }),
    [
      filters,
      baselineFilters,
      sorting,
      baselineSorting,
      searchQuery,
      baselineSearch,
      columnVisibility,
      baselineColumnVisibility,
      sanitizedColumnOrder,
      sanitizedBaselineColumnOrder,
      propertyColumnIds,
    ]
  )
  const hasUnsavedViewChanges = !viewMatchesBaseline

  const deferSetColumnOrder = useDeferredColumnOrderChange(setColumnOrder)

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
        columnOrder: sanitizedColumnOrder,
        pagination,
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={setColumnVisibility}
      onColumnOrderChange={deferSetColumnOrder}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onColumnFiltersChange={setFilters}
      enableMultiSort={true}
      enablePinning={false}
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
              <Visibility isVisible={!hideSaveView && hasUnsavedViewChanges}>
                <SaveViewActionsMenu
                  canOverwrite={!!savedViewId}
                  overwriteLoading={overwriteLoading}
                  onOverwrite={handleOverwriteSavedView}
                  onOpenSaveAsNew={() => setIsSaveViewDialogOpen(true)}
                  onDiscard={handleDiscardViewChanges}
                />
              </Visibility>
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
              availableItems={availableSortItems}
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
            locationId: hasLocationFilter ? undefined : (locationId ?? undefined),
            searchQuery: searchQuery || undefined,
            columnVisibility,
            columnOrder,
          } satisfies ViewParameters)}
          presentation={savedViewId ? 'default' : 'fromSystemList'}
          onCreated={onSavedViewCreated}
        />
      </div>
    </TableProvider>
  )
})

PatientList.displayName = 'PatientList'
