import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useMutation } from '@apollo/client/react'
import type { IdentifierFilterValue, FilterListItem, FilterListPopUpBuilderProps } from '@helpwave/hightide'
import { Chip, FillerCell, HelpwaveLogo, LoadingContainer, SearchBar, ProgressIndicator, Tooltip, Drawer, TableProvider, TableDisplay, TableColumnSwitcher, IconButton, useLocale, FilterList, SortingList, Button, ExpansionIcon, Visibility, ConfirmDialog } from '@helpwave/hightide'
import clsx from 'clsx'
import { LayoutGrid, PlusIcon, Table2 } from 'lucide-react'
import type { LocationType, PropertyValueInput } from '@/api/gql/generated'
import { Sex, PatientState, type GetPatientsQuery, type TaskType, PropertyEntity, FieldType, type QueryableField } from '@/api/gql/generated'
import { usePropertyDefinitions, usePatientsPaginated, useQueryableFields, useRefreshingEntityIds, useUpdatePatient } from '@/data'
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
import { columnFiltersToQueryFilterClauses, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { LIST_PAGE_SIZE } from '@/utils/listPaging'
import { useAccumulatedPagination } from '@/hooks/useAccumulatedPagination'
import { DateDisplay } from '@/components/Date/DateDisplay'
import { PatientCardView } from '@/components/patients/PatientCardView'
import { queryableFieldsToFilterListItems, queryableFieldsToSortingListItems, type QueryableChoiceTagLabelResolver } from '@/utils/queryableFilterList'
import { getPropertyFilterFn as getPropertyDatatype } from '@/utils/propertyFilterMapping'
import { UserSelectFilterPopUp } from './UserSelectFilterPopUp'
import { ExpandableTextBlock } from '@/components/common/ExpandableTextBlock'
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
import { useStableSerializedList } from '@/hooks/useStableSerializedList'
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
import { applyVirtualDerivedPatients } from '@/utils/virtualDerivedTableState'
import type { ViewParameters } from '@/utils/viewDefinition'
import { DUMMY_SUGGESTION } from '@/data/mockSystemSuggestions'
import { SystemSuggestionModal } from '@/components/patients/SystemSuggestionModal'
import type { SystemSuggestion } from '@/types/systemSuggestion'
import { PropertyColumnHeader } from '@/components/properties/PropertyColumnHeader'
import { ClearPropertyColumnDialog } from '@/components/properties/ClearPropertyColumnDialog'
import { buildPropertyValueInputsExcludingDefinition } from '@/utils/propertyValueInputs'

export type PatientViewModel = {
  id: string,
  name: string,
  firstname: string,
  lastname: string,
  clinic: GetPatientsQuery['patients'][0]['clinic'] | null,
  position: GetPatientsQuery['patients'][0]['position'],
  openTasksCount: number,
  closedTasksCount: number,
  birthdate: Date,
  sex: Sex,
  state: PatientState,
  tasks: TaskType[],
  properties?: GetPatientsQuery['patients'][0]['properties'],
}

type ClearPatientPropertyState = {
  propertyDefinitionId: string,
  propertyName: string,
}

const LOCATION_KIND_HEADERS: Record<LocationKindColumn, string> = {
  CLINIC: 'locationClinic',
  WARD: 'locationWard',
  ROOM: 'locationRoom',
  BED: 'locationBed',
}

const ADMITTED_OR_WAITING_STATES: PatientState[] = [PatientState.Admitted, PatientState.Wait]

const PATIENT_CARD_PRIMARY_COLUMN_IDS = new Set([
  'name',
  'state',
  'sex',
  'position',
  'birthdate',
  'tasks',
])

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
  onPatientUpdated?: () => void,
  embedded?: boolean,
  embeddedPatients?: PatientViewModel[],
  embeddedOnRefetch?: () => void,
  /** When set with embeddedPatients: client-side filter/sort/search on derived rows; show full toolbar. */
  derivedVirtualMode?: boolean,
  /** Persist overwrite targets base view triple or related triple (opposite tab). */
  savedViewScope?: 'base' | 'related',
}

export const PatientList = forwardRef<PatientListRef, PatientListProps>(({ initialPatientId, onInitialPatientOpened, acceptedStates: _acceptedStates, rootLocationIds, locationId, viewDefaultFilters, viewDefaultSorting, viewDefaultSearchQuery, viewDefaultColumnVisibility, viewDefaultColumnOrder, readOnly: _readOnly, hideSaveView, savedViewId, onSavedViewCreated, onPatientUpdated, embedded = false, embeddedPatients, embeddedOnRefetch, derivedVirtualMode = false, savedViewScope = 'base' }, ref) => {
  const translation = useTasksTranslation()
  const { locale } = useLocale()
  const { selectedRootLocationIds } = useTasksContext()
  const { refreshingPatientIds } = useRefreshingEntityIds()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const { data: queryableFieldsData } = useQueryableFields('Patient')
  const queryableFieldsStable = useStableSerializedList(
    queryableFieldsData?.queryableFields,
    (f) => ({
      key: f.key,
      label: f.label,
      filterable: f.filterable,
      sortable: f.sortable,
      sortDirections: f.sortDirections,
      propertyDefinitionId: f.propertyDefinitionId,
      kind: f.kind,
      valueType: f.valueType,
      choice: f.choice
        ? { keys: f.choice.optionKeys, labels: f.choice.optionLabels }
        : null,
    })
  )
  const effectiveRootLocationIds = rootLocationIds ?? selectedRootLocationIds
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientViewModel | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState(viewDefaultSearchQuery ?? '')
  const [openedPatientId, setOpenedPatientId] = useState<string | null>(null)
  const [isCreatePatientDraftDirty, setIsCreatePatientDraftDirty] = useState(false)
  const [isDiscardPatientCreateOpen, setIsDiscardPatientCreateOpen] = useState(false)
  const [isShowFilters, setIsShowFilters] = useState(false)
  const [isShowSorting, setIsShowSorting] = useState(false)
  const [clearPropertyState, setClearPropertyState] = useState<ClearPatientPropertyState | null>(null)
  const [isClearingProperty, setIsClearingProperty] = useState(false)
  const [clearPropertyProcessedCount, setClearPropertyProcessedCount] = useState(0)
  const [clearPropertyError, setClearPropertyError] = useState<string | null>(null)
  const [updatePatient] = useUpdatePatient()

  const [fetchPageIndex, setFetchPageIndex] = useState(0)
  const [listLayout, setListLayout] = useState<'table' | 'card'>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 'card' : 'table'
  ))

  useEffect(() => {
    if (embedded && !derivedVirtualMode) {
      setListLayout('table')
    }
  }, [embedded, derivedVirtualMode])

  const showFullToolbar = !embedded || derivedVirtualMode
  const useEmbeddedNoop = embedded && !derivedVirtualMode
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
    setFetchPageIndex(0)
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

  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)
  const [suggestionModalSuggestion, setSuggestionModalSuggestion] = useState<SystemSuggestion | null>(null)
  const [suggestionModalPatientName, setSuggestionModalPatientName] = useState('')

  const closeSuggestionModal = useCallback(() => {
    setSuggestionModalOpen(false)
    setSuggestionModalSuggestion(null)
    setSuggestionModalPatientName('')
  }, [])

  const openSuggestionModal = useCallback((suggestion: SystemSuggestion, patientName: string) => {
    setSuggestionModalSuggestion(suggestion)
    setSuggestionModalPatientName(patientName)
    setSuggestionModalOpen(true)
  }, [])

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
    if (savedViewScope === 'related') {
      await updateSavedView({
        variables: {
          id: savedViewId,
          data: {
            relatedFilterDefinition: serializeColumnFiltersForView(filters as ColumnFiltersState),
            relatedSortDefinition: serializeSortingForView(sorting),
            relatedParameters: stringifyViewParameters({
              searchQuery: searchQuery || undefined,
              columnVisibility,
              columnOrder,
            } satisfies ViewParameters),
          },
        },
      })
      return
    }
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
    savedViewScope,
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

  const searchInput = useMemo(
    () => (searchQuery
      ? { searchText: searchQuery, includeProperties: true }
      : undefined),
    [searchQuery]
  )
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])
  const apiPagination = useMemo(
    () => ({ pageIndex: fetchPageIndex, pageSize: LIST_PAGE_SIZE }),
    [fetchPageIndex]
  )

  const accumulationResetKey = useMemo(
    () => JSON.stringify({
      filters: apiFilters,
      sorts: apiSorting,
      search: searchInput,
      locationId: hasLocationFilter ? undefined : (locationId || undefined),
      root: effectiveRootLocationIds,
      states: patientStates,
    }),
    [apiFilters, apiSorting, searchInput, hasLocationFilter, locationId, effectiveRootLocationIds, patientStates]
  )

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
      skip: derivedVirtualMode || (embedded && embeddedPatients !== undefined),
    }
  )
  if (totalCount != null) lastTotalCountRef.current = totalCount
  const stableTotalCount = totalCount ?? lastTotalCountRef.current

  const { accumulated: accumulatedPatientsRaw, loadMore, hasMore } = useAccumulatedPagination({
    resetKey: accumulationResetKey,
    pageData: patientsData,
    pageIndex: fetchPageIndex,
    setPageIndex: setFetchPageIndex,
    totalCount: stableTotalCount,
    loading: patientsLoading,
  })

  const mapPatientRow = useCallback((p: GetPatientsQuery['patients'][0]): PatientViewModel => {
    const countForAggregate = ADMITTED_OR_WAITING_STATES.includes(p.state)
    return {
      id: p.id,
      name: p.name,
      firstname: p.firstname,
      lastname: p.lastname,
      clinic: p.clinic ?? null,
      birthdate: new Date(p.birthdate),
      sex: p.sex,
      state: p.state,
      position: p.position,
      openTasksCount: countForAggregate ? (p.tasks?.filter(t => !t.done).length ?? 0) : 0,
      closedTasksCount: countForAggregate ? (p.tasks?.filter(t => t.done).length ?? 0) : 0,
      tasks: [],
      properties: p.properties ?? [],
    }
  }, [])

  const patientsFromSource = useMemo((): PatientViewModel[] => {
    if (embedded && embeddedPatients !== undefined) return embeddedPatients
    if (!accumulatedPatientsRaw || accumulatedPatientsRaw.length === 0) return []
    return accumulatedPatientsRaw.map(mapPatientRow)
  }, [embedded, embeddedPatients, accumulatedPatientsRaw, mapPatientRow])

  const patients: PatientViewModel[] = useMemo(() => {
    if (derivedVirtualMode && embeddedPatients !== undefined) {
      return applyVirtualDerivedPatients(
        embeddedPatients,
        filters as ColumnFiltersState,
        sorting,
        searchQuery
      )
    }
    return patientsFromSource
  }, [
    derivedVirtualMode,
    embeddedPatients,
    patientsFromSource,
    filters,
    sorting,
    searchQuery,
  ])

  const showBlockingLoadingOverlay = patientsLoading && patients.length === 0 && !derivedVirtualMode

  const tablePagination = useMemo(
    (): PaginationState => ({
      pageIndex: 0,
      pageSize: Math.max(patients.length, 1),
    }),
    [patients.length]
  )

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

  const isPatientCreateMode = !selectedPatient && !openedPatientId

  const closePatientDrawer = useCallback(() => {
    setIsPanelOpen(false)
    setSelectedPatient(undefined)
    setOpenedPatientId(null)
    setIsCreatePatientDraftDirty(false)
    setIsDiscardPatientCreateOpen(false)
  }, [])

  const handleClose = useCallback(() => {
    if (isPanelOpen && isPatientCreateMode && isCreatePatientDraftDirty) {
      setIsDiscardPatientCreateOpen(true)
      return
    }
    closePatientDrawer()
  }, [isPanelOpen, isPatientCreateMode, isCreatePatientDraftDirty, closePatientDrawer])

  const patientPropertyColumns = useMemo<ColumnDef<PatientViewModel>[]>(
    () => getPropertyColumnsForEntity<PatientViewModel>(propertyDefinitionsData, PropertyEntity.Patient, false),
    [propertyDefinitionsData]
  )

  const clearablePatients = useMemo(() => {
    if (!clearPropertyState) return []
    return patients.filter(patient => (patient.properties ?? []).some(
      property => property.definition.id === clearPropertyState.propertyDefinitionId
    ))
  }, [clearPropertyState, patients])

  const handleOpenClearProperty = useCallback((propertyDefinitionId: string, propertyName: string) => {
    setClearPropertyError(null)
    setClearPropertyProcessedCount(0)
    setClearPropertyState({ propertyDefinitionId, propertyName })
  }, [])

  const handleCloseClearProperty = useCallback(() => {
    if (isClearingProperty) return
    setClearPropertyState(null)
    setClearPropertyProcessedCount(0)
    setClearPropertyError(null)
  }, [isClearingProperty])

  const handleConfirmClearProperty = useCallback(async () => {
    if (!clearPropertyState || isClearingProperty) return
    const targets = patients.filter(patient => (patient.properties ?? []).some(
      property => property.definition.id === clearPropertyState.propertyDefinitionId
    ))
    setClearPropertyError(null)
    setClearPropertyProcessedCount(0)
    setIsClearingProperty(true)

    try {
      const batchSize = 8
      for (let index = 0; index < targets.length; index += batchSize) {
        const chunk = targets.slice(index, index + batchSize)
        await Promise.all(chunk.map(async (patient) => {
          const propertyInputs = buildPropertyValueInputsExcludingDefinition(
            patient.properties,
            clearPropertyState.propertyDefinitionId
          )
          propertyInputs.push({
            definitionId: clearPropertyState.propertyDefinitionId,
          } satisfies PropertyValueInput)
          await updatePatient({
            variables: {
              id: patient.id,
              data: {
                properties: propertyInputs,
              },
            },
          })
        }))
        setClearPropertyProcessedCount(Math.min(index + chunk.length, targets.length))
      }
      setClearPropertyState(null)
      embeddedOnRefetch?.()
      void refetch()
      onPatientUpdated?.()
    } catch (error) {
      setClearPropertyError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsClearingProperty(false)
    }
  }, [
    clearPropertyState,
    isClearingProperty,
    patients,
    updatePatient,
    embeddedOnRefetch,
    refetch,
    onPatientUpdated,
  ])

  const patientPropertyColumnsWithActions = useMemo<ColumnDef<PatientViewModel>[]>(() => (
    patientPropertyColumns.map((column) => {
      const meta = column.meta as { columnType?: string, propertyDefinitionId?: string, columnLabel?: string } | undefined
      const propertyDefinitionId = meta?.propertyDefinitionId
      const columnLabel = meta?.columnLabel
      if (meta?.columnType !== 'PROPERTY' || !propertyDefinitionId || !columnLabel) {
        return column
      }
      const nextColumn = { ...column } as ColumnDef<PatientViewModel>
      nextColumn.header = () => (
        <PropertyColumnHeader
          title={columnLabel}
          clearActionLabel={translation('clearPropertyColumnActionPatient')}
          onClear={() => handleOpenClearProperty(propertyDefinitionId, columnLabel)}
        />
      )
      return nextColumn
    })
  ), [patientPropertyColumns, translation, handleOpenClearProperty])

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
      id: 'clinic',
      header: translation('clinic'),
      accessorFn: ({ clinic }: PatientViewModel) => clinic?.title,
      cell: ({ row }: { row: Row<PatientViewModel> }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const clinic = row.original.clinic
        return (
          <>
            <span className="print:block hidden">{clinic?.title}</span>
            <LocationChips
              locations={clinic ? [{ id: clinic.id, title: clinic.title, kind: clinic.kind as LocationType }] : []}
              small
              className="print:hidden"
            />
          </>
        )
      },
      minSize: 160,
      size: 220,
      maxSize: 300,
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
    ...(['WARD', 'ROOM', 'BED'] as const).map((kind): ColumnDef<PatientViewModel> => ({
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
    {
      id: 'updateDate',
      header: translation('updated'),
      accessorFn: (row) => {
        const taskList = row.tasks || []
        const updateDates = taskList
          .map(t => t.updateDate ? new Date(t.updateDate) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())
        return updateDates[0]
      },
      cell: ({ row }) => {
        if (refreshingPatientIds.has(row.original.id)) return rowLoadingCell
        const taskList = row.original.tasks || []
        const updateDates = taskList
          .map(t => t.updateDate ? new Date(t.updateDate) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())
        const d = updateDates[0]
        if (!d) return <FillerCell />
        return <DateDisplay date={d} mode="absolute" />
      },
      minSize: 220,
      size: 220,
      maxSize: 220,
      filterFn: 'date',
    },
    ...patientPropertyColumnsWithActions.map((col) => ({
      ...col,
      cell: col.cell
        ? (params: { row: { original: PatientViewModel } }) =>
          refreshingPatientIds.has(params.row.original.id) ? rowLoadingCell : (col.cell as (p: unknown) => React.ReactNode)(params)
        : undefined,
    })),
  ], [translation, patientPropertyColumnsWithActions, refreshingPatientIds, rowLoadingCell, dateFormat])

  const propertyFieldTypeByDefId = useMemo(
    () => new Map(propertyDefinitionsData?.propertyDefinitions.map(d => [d.id, d.fieldType]) ?? []),
    [propertyDefinitionsData]
  )

  const renderPatientCardExtras = useCallback((patient: PatientViewModel): ReactNode => {
    const rows: ReactNode[] = []
    for (const col of columns) {
      const id = col.id as string | undefined
      if (!id || PATIENT_CARD_PRIMARY_COLUMN_IDS.has(id)) continue
      if (columnVisibility[id] === false) continue
      if (!col.cell) continue
      const isExpandableTextProperty = id.startsWith('property_') &&
        propertyFieldTypeByDefId.get(id.replace('property_', '')) === FieldType.FieldTypeText
      const meta = col.meta as { columnLabel?: string } | undefined
      const headerLabel = typeof col.header === 'string' ? col.header : (meta?.columnLabel ?? id)
      const cell = (col.cell as (p: { row: { original: PatientViewModel } }) => ReactNode)({ row: { original: patient } })
      const propertyId = id.startsWith('property_') ? id.replace('property_', '') : null
      const propertyTextValue = propertyId
        ? patient.properties?.find(property => property.definition.id === propertyId)?.textValue
        : null
      rows.push(
        <div key={id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 sm:items-start text-left">
          <span className="text-description shrink-0 min-w-[7rem]">{headerLabel}</span>
          <div className="min-w-0 break-words">
            {isExpandableTextProperty ? (
              <ExpandableTextBlock>{propertyTextValue ?? ''}</ExpandableTextBlock>
            ) : cell}
          </div>
        </div>
      )
    }
    if (rows.length === 0) return null
    return <div className="mt-3 pt-3 border-t border-border space-y-2 w-full">{rows}</div>
  }, [columns, columnVisibility, propertyFieldTypeByDefId])

  const resolvePatientQueryableLabel = useCallback((field: QueryableField): string => {
    if (field.propertyDefinitionId) return field.label
    const key = field.key === 'locationSubtree' ? 'position' : field.key
    const translatedByKey: Partial<Record<string, string>> = {
      'name': translation('name'),
      'firstname': translation('firstName'),
      'lastname': translation('lastName'),
      'birthdate': translation('birthdate'),
      'sex': translation('sex'),
      'state': translation('status'),
      'clinic': translation('clinic'),
      'position': translation('location'),
      'location-WARD': translation('locationWard'),
      'location-ROOM': translation('locationRoom'),
      'location-BED': translation('locationBed'),
      'tasks': translation('tasks'),
      'updated': translation('updated'),
      'updateDate': translation('updated'),
      'description': translation('description'),
    }
    return translatedByKey[key] ?? field.label
  }, [translation])

  const resolvePatientChoiceTagLabel = useCallback<QueryableChoiceTagLabelResolver>((field, optionKey, backendLabel) => {
    if (field.propertyDefinitionId) return backendLabel
    if (field.key === 'state') return translation('patientState', { state: optionKey })
    if (field.key === 'sex') {
      if (optionKey === Sex.Male) return translation('male')
      if (optionKey === Sex.Female) return translation('female')
      return translation('diverse')
    }
    return backendLabel
  }, [translation])

  const availableFilters: FilterListItem[] = useMemo(() => {
    const raw = queryableFieldsStable
    if (raw?.length) {
      return queryableFieldsToFilterListItems(
        raw,
        propertyFieldTypeByDefId,
        resolvePatientQueryableLabel,
        resolvePatientChoiceTagLabel
      )
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
        id: 'clinic',
        label: translation('clinic'),
        dataType: 'text',
        tags: [],
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
      ...(['WARD', 'ROOM', 'BED'] as const).map((kind): FilterListItem => ({
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
  }, [queryableFieldsStable, propertyFieldTypeByDefId, resolvePatientQueryableLabel, resolvePatientChoiceTagLabel, translation, allPatientStates, propertyDefinitionsData?.propertyDefinitions])

  const availableSortItems = useMemo(() => {
    const raw = queryableFieldsStable
    if (raw?.length) {
      return queryableFieldsToSortingListItems(raw, resolvePatientQueryableLabel)
    }
    return availableFilters.map(({ id, label, dataType }) => ({ id, label, dataType }))
  }, [queryableFieldsStable, availableFilters, resolvePatientQueryableLabel])

  const knownColumnIdsOrdered = useMemo(
    () => columnIdsFromColumnDefs(columns),
    [columns]
  )

  const embeddedDashboardColumnVisibility = useMemo((): VisibilityState | null => {
    if (!embedded || derivedVirtualMode) return null
    const visible = new Set<string>(['name', 'position', 'updateDate'])
    const vis: VisibilityState = {}
    for (const id of knownColumnIdsOrdered) {
      vis[id] = visible.has(id)
    }
    return vis
  }, [embedded, derivedVirtualMode, knownColumnIdsOrdered])

  const tableColumnVisibility = embedded && !derivedVirtualMode && embeddedDashboardColumnVisibility != null
    ? embeddedDashboardColumnVisibility
    : columnVisibility

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

  const embeddedTableStateNoop = useCallback(() => {}, [])

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
          pageSize: LIST_PAGE_SIZE,
        }
      }}
      state={{
        columnVisibility: tableColumnVisibility,
        columnOrder: sanitizedColumnOrder,
        pagination: tablePagination,
      } as Partial<TableState> as TableState}
      onColumnVisibilityChange={useEmbeddedNoop ? embeddedTableStateNoop : setColumnVisibility}
      onColumnOrderChange={useEmbeddedNoop ? embeddedTableStateNoop : deferSetColumnOrder}
      onPaginationChange={() => {}}
      onSortingChange={useEmbeddedNoop ? embeddedTableStateNoop : setSorting}
      onColumnFiltersChange={useEmbeddedNoop ? embeddedTableStateNoop : setFilters}
      enableMultiSort={true}
      enablePinning={false}
      pageCount={1}

      manualPagination={true}
      manualSorting={true}
      manualFiltering={true}

      enableColumnFilters={false}
      enableSorting={false}
      enableColumnPinning={false}
    >
      <div className="flex flex-col h-full gap-4">
        {showFullToolbar && (
          <div className="flex-col-2 w-full">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-row-8 sm:justify-between sm:gap-0 w-full">
              <div className="flex flex-wrap gap-2 items-center">
                <SearchBar
                  placeholder={translation('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onSearch={() => null}
                  containerProps={{ className: 'w-full max-w-full min-w-0 sm:max-w-80' }}
                />
                <TableColumnSwitcher
                  buttonProps={{ className: 'min-h-11 min-w-11 shrink-0' }}
                  style={{ zIndex: 120 }}
                />
                <div className="inline-flex flex-wrap gap-2 items-center shrink-0">
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
                </div>
                <Visibility isVisible={!hideSaveView && hasUnsavedViewChanges}>
                  <SaveViewActionsMenu
                    canOverwrite={!!savedViewId}
                    overwriteLoading={overwriteLoading}
                    onOverwrite={handleOverwriteSavedView}
                    onOpenSaveAsNew={() => setIsSaveViewDialogOpen(true)}
                    onDiscard={handleDiscardViewChanges}
                    hideSaveAsNew={savedViewScope === 'related' && derivedVirtualMode}
                  />
                </Visibility>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-end shrink-0">
                <IconButton
                  tooltip={translation('listViewTable')}
                  className="min-h-11 min-w-11"
                  onClick={() => setListLayout('table')}
                  color={listLayout === 'table' ? 'primary' : 'neutral'}
                >
                  <Table2 className="size-5" />
                </IconButton>
                <IconButton
                  tooltip={translation('listViewCard')}
                  className="min-h-11 min-w-11"
                  onClick={() => setListLayout('card')}
                  color={listLayout === 'card' ? 'primary' : 'neutral'}
                >
                  <LayoutGrid className="size-5" />
                </IconButton>
                {!derivedVirtualMode && (
                  <IconButton
                    tooltip={translation('addPatient')}
                    className="min-h-11 min-w-11"
                    onClick={() => {
                      setSelectedPatient(undefined)
                      setIsPanelOpen(true)
                    }}
                    color="primary"
                  >
                    <PlusIcon />
                  </IconButton>
                )}
              </div>
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
        )}
        <div className="relative print:static">
          {showBlockingLoadingOverlay && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 rounded-lg min-h-48">
              <HelpwaveLogo animate="loading" color="currentColor" height={64} width={64} />
            </div>
          )}
          <div className={clsx(listLayout === 'table' ? 'block' : 'hidden print:block')}>
            <TableDisplay className="print-content overflow-x-auto touch-pan-x"/>
          </div>
          {listLayout === 'card' && (
            <div className="flex flex-col gap-3 w-full print:hidden">
              {patients.map((patient) => (
                <PatientCardView
                  key={patient.id}
                  patient={patient}
                  onClick={handleEdit}
                  extraContent={renderPatientCardExtras(patient)}
                />
              ))}
            </div>
          )}
          {stableTotalCount != null && hasMore && !embedded && !derivedVirtualMode && (
            <Button color="neutral" className="mt-2 w-full sm:w-auto self-center" onClick={loadMore}>
              {translation('loadMore')}
            </Button>
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
            onClose={closePatientDrawer}
            onSuccess={() => {
              embeddedOnRefetch?.()
              void refetch()
              onPatientUpdated?.()
            }}
            onOpenSystemSuggestion={openSuggestionModal}
            onCreateDraftDirtyChange={isPatientCreateMode ? setIsCreatePatientDraftDirty : undefined}
          />
        </Drawer>
        <ConfirmDialog
          isOpen={isDiscardPatientCreateOpen}
          onCancel={() => setIsDiscardPatientCreateOpen(false)}
          onConfirm={closePatientDrawer}
          titleElement={translation('discardDraftTitle')}
          description={translation('discardDraftMessage')}
          confirmType="negative"
          buttonOverwrites={[{}, {}, { text: translation('discard') }]}
        />
        <ClearPropertyColumnDialog
          isOpen={clearPropertyState !== null}
          title={translation('clearPropertyColumnDialogTitlePatient')}
          description={clearPropertyState
            ? translation('clearPropertyColumnDialogDescriptionPatient', {
              propertyName: clearPropertyState.propertyName,
              count: clearablePatients.length,
            })
            : ''}
          instructionLabel={clearPropertyState
            ? translation('clearPropertyColumnTypeNameInstruction', {
              propertyName: clearPropertyState.propertyName,
            })
            : ''}
          confirmLabel={translation('clearPropertyColumnConfirmButtonPatient')}
          cancelLabel={translation('cancel')}
          propertyName={clearPropertyState?.propertyName ?? ''}
          isSubmitting={isClearingProperty}
          processedCount={clearPropertyProcessedCount}
          affectedCount={clearablePatients.length}
          errorMessage={clearPropertyError}
          onClose={handleCloseClearProperty}
          onConfirm={() => void handleConfirmClearProperty()}
        />
        <SystemSuggestionModal
          isOpen={suggestionModalOpen}
          onClose={closeSuggestionModal}
          suggestion={suggestionModalSuggestion ?? DUMMY_SUGGESTION}
          patientName={suggestionModalPatientName}
          onApplied={() => void refetch()}
        />
        {savedViewScope === 'base' && (
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
        )}
      </div>
    </TableProvider>
  )
})

PatientList.displayName = 'PatientList'
