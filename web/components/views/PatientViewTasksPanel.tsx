'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Visibility } from '@helpwave/hightide'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { usePatients } from '@/data'
import { PatientState } from '@/api/gql/generated'
import type { QuerySearchInput } from '@/api/gql/generated'
import {
  PropertyEntity,
  UpdateSavedViewDocument,
  MySavedViewsDocument,
  SavedViewDocument,
  type UpdateSavedViewMutation,
  type UpdateSavedViewMutationVariables
} from '@/api/gql/generated'
import { columnFiltersToQueryFilterClauses, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import {
  deserializeColumnFiltersFromView,
  deserializeSortingFromView,
  hasActiveLocationFilter,
  parseViewParameters,
  serializeColumnFiltersForView,
  serializeSortingForView,
  stringifyViewParameters,
  tableViewStateMatchesBaseline
} from '@/utils/viewDefinition'
import type { ViewParameters } from '@/utils/viewDefinition'
import { TaskList } from '@/components/tables/TaskList'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { applyVirtualDerivedTasks } from '@/utils/virtualDerivedTableState'
import { useTableState } from '@/hooks/useTableState'
import { usePropertyDefinitions } from '@/data'
import { getPropertyColumnIds, useColumnVisibilityWithPropertyDefaults } from '@/hooks/usePropertyColumnVisibility'
import { SaveViewActionsMenu } from '@/components/views/SaveViewActionsMenu'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import { replaceSavedViewInMySavedViewsCache } from '@/utils/savedViewsCache'

const ADMITTED_OR_WAITING: PatientState[] = [PatientState.Admitted, PatientState.Wait]

type PatientViewTasksPanelProps = {
  filterDefinitionJson: string,
  sortDefinitionJson: string,
  parameters: ViewParameters,
  relatedFilterDefinitionJson: string,
  relatedSortDefinitionJson: string,
  relatedParametersJson: string,
  savedViewId?: string,
  isOwner: boolean,
  refreshVersion?: number,
}

export function PatientViewTasksPanel({
  filterDefinitionJson,
  sortDefinitionJson,
  parameters,
  relatedFilterDefinitionJson,
  relatedSortDefinitionJson,
  relatedParametersJson,
  savedViewId,
  isOwner,
  refreshVersion,
}: PatientViewTasksPanelProps) {
  const filters = deserializeColumnFiltersFromView(filterDefinitionJson)
  const sorting = deserializeSortingFromView(sortDefinitionJson)
  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])
  const hasLocationFilter = useMemo(
    () => hasActiveLocationFilter(filters),
    [filters]
  )

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

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

  const searchInput: QuerySearchInput | undefined = parameters.searchQuery
    ? { searchText: parameters.searchQuery, includeProperties: true }
    : undefined

  const { data: patientsData, loading, refetch } = usePatients({
    locationId: hasLocationFilter ? undefined : parameters.locationId,
    rootLocationIds: hasLocationFilter || parameters.locationId
      ? undefined
      : (parameters.rootLocationIds && parameters.rootLocationIds.length > 0 ? parameters.rootLocationIds : undefined),
    states: patientStates,
    filters: apiFilters.length > 0 ? apiFilters : undefined,
    sorts: apiSorting.length > 0 ? apiSorting : undefined,
    search: searchInput,
  })

  const rawTasks: TaskViewModel[] = useMemo(() => {
    if (!patientsData?.patients) return []
    return patientsData.patients.flatMap(patient => {
      if (!ADMITTED_OR_WAITING.includes(patient.state) || !patient.tasks) return []
      const mergedLocations = [
        ...(patient.clinic ? [patient.clinic] : []),
        ...(patient.position ? [patient.position] : []),
        ...(patient.teams || [])
      ]
      return patient.tasks.map(task => ({
        id: task.id,
        name: task.title,
        description: task.description || undefined,
        updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done,
        patient: {
          id: patient.id,
          name: patient.name,
          locations: mergedLocations
        },
        assignee: task.assignees[0]
          ? { id: task.assignees[0].id, name: task.assignees[0].name, avatarURL: task.assignees[0].avatarUrl, isOnline: task.assignees[0].isOnline ?? null }
          : undefined,
        assigneeTeam: task.assigneeTeam
          ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
          : undefined,
        additionalAssigneeCount:
          !task.assigneeTeam && task.assignees.length > 1 ? task.assignees.length - 1 : 0,
        sourceTaskPresetId: task.sourceTaskPresetId ?? null,
      }))
    })
  }, [patientsData])

  const relatedParams = useMemo(() => parseViewParameters(relatedParametersJson), [relatedParametersJson])
  const defaultRelatedFilters = useMemo(
    () => deserializeColumnFiltersFromView(relatedFilterDefinitionJson),
    [relatedFilterDefinitionJson]
  )
  const defaultRelatedSortingRaw = useMemo(
    () => deserializeSortingFromView(relatedSortDefinitionJson),
    [relatedSortDefinitionJson]
  )
  const baselineSort = useMemo(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ], [])
  const relatedSortBaseline = useMemo(
    () => (defaultRelatedSortingRaw.length > 0 ? defaultRelatedSortingRaw : baselineSort),
    [defaultRelatedSortingRaw, baselineSort]
  )
  const baselineSearch = relatedParams.searchQuery ?? ''
  const baselineColumnVisibility = useMemo(
    () => relatedParams.columnVisibility ?? {},
    [relatedParams.columnVisibility]
  )
  const baselineColumnOrder = useMemo(
    () => relatedParams.columnOrder ?? [],
    [relatedParams.columnOrder]
  )

  const persistedRelatedContentKey = useMemo(
    () =>
      `${relatedFilterDefinitionJson}\0${relatedSortDefinitionJson}\0${stringifyViewParameters({
        searchQuery: relatedParams.searchQuery,
        columnVisibility: relatedParams.columnVisibility,
        columnOrder: relatedParams.columnOrder,
      })}`,
    [
      relatedFilterDefinitionJson,
      relatedSortDefinitionJson,
      relatedParams.searchQuery,
      relatedParams.columnVisibility,
      relatedParams.columnOrder,
    ]
  )

  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const propertyColumnIds = useMemo(
    () => getPropertyColumnIds(propertyDefinitionsData, PropertyEntity.Task),
    [propertyDefinitionsData]
  )

  const {
    sorting: relatedSorting,
    setSorting: setRelatedSorting,
    filters: relatedFilters,
    setFilters: setRelatedFilters,
    columnVisibility: relatedColumnVisibility,
    setColumnVisibility: setRelatedColumnVisibilityRaw,
    columnOrder: relatedColumnOrder,
    setColumnOrder: setRelatedColumnOrder,
  } = useTableState({
    defaultFilters: defaultRelatedFilters,
    defaultSorting: relatedSortBaseline,
    defaultColumnVisibility: baselineColumnVisibility,
    defaultColumnOrder: baselineColumnOrder,
  })

  const setRelatedColumnVisibility = useColumnVisibilityWithPropertyDefaults(
    propertyDefinitionsData,
    PropertyEntity.Task,
    setRelatedColumnVisibilityRaw
  )

  const [searchQuery, setSearchQuery] = useState(baselineSearch)

  useEffect(() => {
    setRelatedFilters(deserializeColumnFiltersFromView(relatedFilterDefinitionJson))
    const nextSort = deserializeSortingFromView(relatedSortDefinitionJson)
    setRelatedSorting(nextSort.length > 0 ? nextSort : baselineSort)
    setSearchQuery(relatedParams.searchQuery ?? '')
    setRelatedColumnVisibility(relatedParams.columnVisibility ?? {})
    setRelatedColumnOrder(relatedParams.columnOrder ?? [])
  }, [
    persistedRelatedContentKey,
    relatedFilterDefinitionJson,
    relatedSortDefinitionJson,
    relatedParams.searchQuery,
    relatedParams.columnVisibility,
    relatedParams.columnOrder,
    baselineSort,
    setRelatedFilters,
    setRelatedSorting,
    setRelatedColumnVisibility,
    setRelatedColumnOrder,
  ])

  const viewMatchesRelatedBaseline = useMemo(
    () => tableViewStateMatchesBaseline({
      filters: relatedFilters as ColumnFiltersState,
      baselineFilters: defaultRelatedFilters,
      sorting: relatedSorting,
      baselineSorting: relatedSortBaseline,
      searchQuery,
      baselineSearch,
      columnVisibility: relatedColumnVisibility,
      baselineColumnVisibility,
      columnOrder: relatedColumnOrder,
      baselineColumnOrder,
      propertyColumnIds,
    }),
    [
      relatedFilters,
      defaultRelatedFilters,
      relatedSorting,
      relatedSortBaseline,
      searchQuery,
      baselineSearch,
      relatedColumnVisibility,
      baselineColumnVisibility,
      relatedColumnOrder,
      baselineColumnOrder,
      propertyColumnIds,
    ]
  )
  const hasUnsavedRelatedChanges = !viewMatchesRelatedBaseline

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

  const handleDiscardRelated = useCallback(() => {
    setRelatedFilters(defaultRelatedFilters)
    setRelatedSorting(relatedSortBaseline)
    setSearchQuery(baselineSearch)
    setRelatedColumnVisibility(baselineColumnVisibility)
    setRelatedColumnOrder(baselineColumnOrder)
  }, [
    baselineSearch,
    baselineColumnOrder,
    baselineColumnVisibility,
    defaultRelatedFilters,
    setRelatedColumnOrder,
    setRelatedColumnVisibility,
    setRelatedFilters,
    setRelatedSorting,
    relatedSortBaseline,
  ])

  const handleOverwriteRelated = useCallback(async () => {
    if (!savedViewId) return
    await updateSavedView({
      variables: {
        id: savedViewId,
        data: {
          relatedFilterDefinition: serializeColumnFiltersForView(relatedFilters as ColumnFiltersState),
          relatedSortDefinition: serializeSortingForView(relatedSorting),
          relatedParameters: stringifyViewParameters({
            searchQuery: searchQuery || undefined,
            columnVisibility: relatedColumnVisibility,
            columnOrder: relatedColumnOrder,
          }),
        },
      },
    })
  }, [
    savedViewId,
    updateSavedView,
    relatedFilters,
    relatedSorting,
    searchQuery,
    relatedColumnVisibility,
    relatedColumnOrder,
  ])

  const displayedTasks = useMemo(
    () => applyVirtualDerivedTasks(rawTasks, relatedFilters, relatedSorting, searchQuery),
    [rawTasks, relatedFilters, relatedSorting, searchQuery]
  )

  useEffect(() => {
    if (refreshVersion === undefined || refreshVersion <= 0) return
    refetch()
  }, [refreshVersion, refetch])

  return (
    <TaskList
      tasks={displayedTasks}
      virtualDerivedOrder
      onRefetch={refetch}
      showAssignee={true}
      loading={loading}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      saveViewSlot={isOwner && savedViewId ? (
        <Visibility isVisible={hasUnsavedRelatedChanges}>
          <SaveViewActionsMenu
            canOverwrite={true}
            overwriteLoading={overwriteLoading}
            onOverwrite={handleOverwriteRelated}
            onOpenSaveAsNew={() => null}
            onDiscard={handleDiscardRelated}
            hideSaveAsNew={true}
          />
        </Visibility>
      ) : undefined}
      tableState={{
        sorting: relatedSorting,
        setSorting: setRelatedSorting,
        filters: relatedFilters,
        setFilters: setRelatedFilters,
        columnVisibility: relatedColumnVisibility,
        setColumnVisibility: setRelatedColumnVisibility,
        columnOrder: relatedColumnOrder,
        setColumnOrder: setRelatedColumnOrder,
      }}
    />
  )
}
