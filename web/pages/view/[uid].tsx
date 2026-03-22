'use client'

import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button, Chip, IconButton, LoadingContainer, TabList, TabPanel, TabSwitcher, Visibility } from '@helpwave/hightide'
import { CenteredLoadingLogo } from '@/components/CenteredLoadingLogo'
import { PatientList } from '@/components/tables/PatientList'
import { TaskList, type TaskViewModel } from '@/components/tables/TaskList'
import { PatientViewTasksPanel } from '@/components/views/PatientViewTasksPanel'
import { TaskViewPatientsPanel } from '@/components/views/TaskViewPatientsPanel'
import { usePropertyDefinitions, useSavedView, useTasksPaginated } from '@/data'
import { getPropertyColumnIds } from '@/hooks/usePropertyColumnVisibility'
import {
  DuplicateSavedViewDocument,
  MySavedViewsDocument,
  SavedViewDocument,
  UpdateSavedViewDocument,
  type DuplicateSavedViewMutation,
  type DuplicateSavedViewMutationVariables,
  type UpdateSavedViewMutation,
  type UpdateSavedViewMutationVariables,
  PropertyEntity,
  SavedViewEntityType
} from '@/api/gql/generated'
import { getParsedDocument } from '@/data/hooks/queryHelpers'
import {
  deserializeColumnFiltersFromView,
  deserializeSortingFromView,
  parseViewParameters,
  serializeColumnFiltersForView,
  serializeSortingForView,
  stringifyViewParameters,
  tableViewStateMatchesBaseline
} from '@/utils/viewDefinition'
import { SaveViewDialog } from '@/components/views/SaveViewDialog'
import { SaveViewActionsMenu } from '@/components/views/SaveViewActionsMenu'
import { SavedViewEntityTypeChip } from '@/components/views/SavedViewEntityTypeChip'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useTableState } from '@/hooks/useTableState'
import { columnFiltersToQueryFilterClauses, paginationStateToPaginationInput, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { Share2 } from 'lucide-react'

type SavedTaskViewTabProps = {
  viewId: string,
  filterDefinition: string,
  sortDefinition: string,
  parameters: ReturnType<typeof parseViewParameters>,
  isOwner: boolean,
}

function SavedTaskViewTab({
  viewId,
  filterDefinition,
  sortDefinition,
  parameters,
  isOwner,
}: SavedTaskViewTabProps) {
  const router = useRouter()
  const { selectedRootLocationIds, user } = useTasksContext()
  const defaultFilters = deserializeColumnFiltersFromView(filterDefinition)
  const defaultSorting = deserializeSortingFromView(sortDefinition)

  const baselineSort = useMemo(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ], [])

  const viewSortBaseline = useMemo(
    () => (defaultSorting.length > 0 ? defaultSorting : baselineSort),
    [defaultSorting, baselineSort]
  )

  const baselineSearch = parameters.searchQuery ?? ''
  const baselineColumnVisibility = useMemo(
    () => parameters.columnVisibility ?? {},
    [parameters.columnVisibility]
  )
  const baselineColumnOrder = useMemo(
    () => parameters.columnOrder ?? [],
    [parameters.columnOrder]
  )

  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const propertyColumnIds = useMemo(
    () => getPropertyColumnIds(propertyDefinitionsData, PropertyEntity.Task),
    [propertyDefinitionsData]
  )

  const persistedViewContentKey = useMemo(
    () =>
      `${filterDefinition}\0${sortDefinition}\0${stringifyViewParameters({
        rootLocationIds: parameters.rootLocationIds,
        locationId: parameters.locationId,
        searchQuery: parameters.searchQuery,
        assigneeId: parameters.assigneeId,
        columnVisibility: parameters.columnVisibility,
        columnOrder: parameters.columnOrder,
      })}`,
    [filterDefinition, sortDefinition, parameters]
  )

  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  } = useTableState({
    defaultFilters,
    defaultSorting: viewSortBaseline,
    defaultColumnVisibility: baselineColumnVisibility,
    defaultColumnOrder: baselineColumnOrder,
  })

  const [searchQuery, setSearchQuery] = useState(baselineSearch)
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false)

  useEffect(() => {
    const nextFilters = deserializeColumnFiltersFromView(filterDefinition)
    const nextSort = deserializeSortingFromView(sortDefinition)
    const nextSortBaseline = nextSort.length > 0
      ? nextSort
      : [
        { id: 'done', desc: false },
        { id: 'dueDate', desc: false },
      ]
    setFilters(nextFilters)
    setSorting(nextSortBaseline)
    setSearchQuery(parameters.searchQuery ?? '')
    setColumnVisibility(parameters.columnVisibility ?? {})
    setColumnOrder(parameters.columnOrder ?? [])
    setPagination({ pageSize: 10, pageIndex: 0 })
  }, [
    persistedViewContentKey,
    filterDefinition,
    sortDefinition,
    parameters.searchQuery,
    parameters.columnVisibility,
    parameters.columnOrder,
    setFilters,
    setSorting,
    setSearchQuery,
    setColumnVisibility,
    setColumnOrder,
    setPagination,
  ])

  const viewMatchesBaseline = useMemo(
    () => tableViewStateMatchesBaseline({
      filters: filters as ColumnFiltersState,
      baselineFilters: defaultFilters,
      sorting,
      baselineSorting: viewSortBaseline,
      searchQuery,
      baselineSearch,
      columnVisibility,
      baselineColumnVisibility,
      columnOrder,
      baselineColumnOrder,
      propertyColumnIds,
    }),
    [
      filters,
      defaultFilters,
      sorting,
      viewSortBaseline,
      searchQuery,
      baselineSearch,
      columnVisibility,
      baselineColumnVisibility,
      columnOrder,
      baselineColumnOrder,
      propertyColumnIds,
    ]
  )
  const hasUnsavedViewChanges = !viewMatchesBaseline

  const [updateSavedView, { loading: overwriteLoading }] = useMutation<
    UpdateSavedViewMutation,
    UpdateSavedViewMutationVariables
  >(getParsedDocument(UpdateSavedViewDocument), {
    refetchQueries: [
      { query: getParsedDocument(SavedViewDocument), variables: { id: viewId } },
      { query: getParsedDocument(MySavedViewsDocument) },
    ],
  })

  const handleDiscardTaskView = useCallback(() => {
    setFilters(defaultFilters)
    setSorting(viewSortBaseline)
    setSearchQuery(baselineSearch)
    setColumnVisibility(baselineColumnVisibility)
    setColumnOrder(baselineColumnOrder)
  }, [
    baselineSearch,
    baselineColumnOrder,
    baselineColumnVisibility,
    defaultFilters,
    setFilters,
    setSorting,
    setSearchQuery,
    setColumnVisibility,
    setColumnOrder,
    viewSortBaseline,
  ])

  const rootIds = parameters.rootLocationIds?.length ? parameters.rootLocationIds : selectedRootLocationIds
  const assigneeId = parameters.assigneeId ?? user?.id

  const handleOverwriteTaskView = useCallback(async () => {
    await updateSavedView({
      variables: {
        id: viewId,
        data: {
          filterDefinition: serializeColumnFiltersForView(filters as ColumnFiltersState),
          sortDefinition: serializeSortingForView(sorting),
          parameters: stringifyViewParameters({
            rootLocationIds: rootIds ?? undefined,
            assigneeId: assigneeId ?? undefined,
            searchQuery: searchQuery || undefined,
            columnVisibility,
            columnOrder,
          }),
        },
      },
    })
  }, [updateSavedView, viewId, filters, sorting, rootIds, assigneeId, searchQuery, columnVisibility, columnOrder])

  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])
  const apiPagination = useMemo(() => paginationStateToPaginationInput(pagination), [pagination])
  const searchInput = searchQuery
    ? { searchText: searchQuery, includeProperties: true }
    : undefined

  const { data: tasksData, refetch, totalCount, loading: tasksLoading } = useTasksPaginated(
    rootIds && assigneeId
      ? { rootLocationIds: rootIds, assigneeId }
      : undefined,
    {
      pagination: apiPagination,
      sorts: apiSorting.length > 0 ? apiSorting : undefined,
      filters: apiFilters.length > 0 ? apiFilters : undefined,
      search: searchInput,
    }
  )

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!tasksData || tasksData.length === 0) return []
    return tasksData.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority || null,
      estimatedTime: task.estimatedTime ?? null,
      done: task.done,
      patient: task.patient
        ? {
          id: task.patient.id,
          name: task.patient.name,
          locations: task.patient.assignedLocations || []
        }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
        : undefined,
      properties: task.properties ?? [],
    }))
  }, [tasksData])

  const viewParametersForSave = useMemo(() => stringifyViewParameters({
    rootLocationIds: rootIds ?? undefined,
    assigneeId: assigneeId ?? undefined,
    searchQuery: searchQuery || undefined,
  }), [rootIds, assigneeId, searchQuery])

  return (
    <>
      <SaveViewDialog
        isOpen={isSaveViewOpen}
        onClose={() => setIsSaveViewOpen(false)}
        baseEntityType={SavedViewEntityType.Task}
        filterDefinition={serializeColumnFiltersForView(filters as ColumnFiltersState)}
        sortDefinition={serializeSortingForView(sorting)}
        parameters={viewParametersForSave}
        onCreated={(id) => router.push(`/view/${id}`)}
      />
      <TaskList
        tasks={tasks}
        onRefetch={() => void refetch()}
        showAssignee={false}
        totalCount={totalCount}
        loading={tasksLoading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        saveViewSlot={isOwner ? (
          <Visibility isVisible={hasUnsavedViewChanges}>
            <SaveViewActionsMenu
              canOverwrite={true}
              overwriteLoading={overwriteLoading}
              onOverwrite={handleOverwriteTaskView}
              onOpenSaveAsNew={() => setIsSaveViewOpen(true)}
              onDiscard={handleDiscardTaskView}
            />
          </Visibility>
        ) : undefined}
        tableState={{
          pagination,
          setPagination,
          sorting,
          setSorting,
          filters,
          setFilters,
          columnVisibility,
          setColumnVisibility,
          columnOrder,
          setColumnOrder,
        }}
      />
    </>
  )
}

const ViewPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const uid = typeof router.query['uid'] === 'string' ? router.query['uid'] : undefined
  const { data, loading, error } = useSavedView(uid)
  const view = data?.savedView
  const params = useMemo(() => (view ? parseViewParameters(view.parameters) : {}), [view])

  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')

  const [duplicateSavedView] = useMutation<
    DuplicateSavedViewMutation,
    DuplicateSavedViewMutationVariables
  >(getParsedDocument(DuplicateSavedViewDocument), {
    refetchQueries: [{ query: getParsedDocument(MySavedViewsDocument) }],
  })

  const handleDuplicate = useCallback(async () => {
    if (!view?.id || duplicateName.trim().length < 2) return
    const { data: d } = await duplicateSavedView({
      variables: { id: view.id, name: duplicateName.trim() },
    })
    setDuplicateOpen(false)
    setDuplicateName('')
    const newId = d?.duplicateSavedView?.id
    if (newId) router.push(`/view/${newId}`)
  }, [duplicateSavedView, duplicateName, router, view?.id])

  const copyShareLink = useCallback(() => {
    if (typeof window !== 'undefined' && uid) {
      void navigator.clipboard.writeText(`${window.location.origin}/view/${uid}`)
    }
  }, [uid])

  if (!router.isReady || !uid) {
    return (
      <Page pageTitle={titleWrapper(translation('savedViews'))}>
        <CenteredLoadingLogo />
      </Page>
    )
  }

  if (loading) {
    return (
      <Page pageTitle={titleWrapper(translation('savedViews'))}>
        <ContentPanel titleElement={<LoadingContainer className="w-48 h-8" />}>
          <CenteredLoadingLogo />
        </ContentPanel>
      </Page>
    )
  }

  if (error || !view) {
    return (
      <Page pageTitle={titleWrapper(translation('savedViews'))}>
        <ContentPanel titleElement={translation('errorOccurred')}>
          <div className="bg-negative/20 rounded-md p-4">{translation('errorOccurred')}</div>
        </ContentPanel>
      </Page>
    )
  }

  const defaultFilters = deserializeColumnFiltersFromView(view.filterDefinition)
  const defaultSorting = deserializeSortingFromView(view.sortDefinition)

  return (
    <Page pageTitle={titleWrapper(view.name)}>
      <ContentPanel
        titleElement={(
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="typography-title-lg font-bold">{view.name}</span>
              <SavedViewEntityTypeChip entityType={view.baseEntityType} />
              {!view.isOwner && (
                <Chip size="sm" coloringStyle="outline">{translation('readOnlyView')}</Chip>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <IconButton
                tooltip={translation('copyShareLink')}
                coloringStyle="text"
                color="neutral"
                onClick={copyShareLink}
              >
                <Share2 className="size-5" />
              </IconButton>
              {!view.isOwner && (
                <Button color="primary" size="sm" onClick={() => setDuplicateOpen(true)}>
                  {translation('copyViewToMyViews')}
                </Button>
              )}
            </div>
          </div>
        )}
      >
        {duplicateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-shadow p-4">
            <div className="bg-surface rounded-lg p-6 flex flex-col gap-4 max-w-md w-full shadow-lg">
              <span className="typography-title-md font-bold">{translation('copyViewToMyViews')}</span>
              <label className="flex flex-col gap-1">
                <span>{translation('name')}</span>
                <input
                  className="border border-divider rounded px-2 py-1 bg-background"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button color="neutral" onClick={() => setDuplicateOpen(false)}>{translation('cancel')}</Button>
                <Button color="primary" disabled={duplicateName.trim().length < 2} onClick={() => void handleDuplicate()}>
                  {translation('duplicate')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {view.baseEntityType === SavedViewEntityType.Patient && (
          <TabSwitcher>
            <TabList className="mb-6" />
            <TabPanel label={translation('patients')} className="flex-col-0 min-h-48 overflow-auto">
              <PatientList
                key={view.id}
                rootLocationIds={params.rootLocationIds}
                locationId={params.locationId}
                viewDefaultFilters={defaultFilters}
                viewDefaultSorting={defaultSorting}
                viewDefaultSearchQuery={params.searchQuery}
                viewDefaultColumnVisibility={params.columnVisibility}
                viewDefaultColumnOrder={params.columnOrder}
                hideSaveView={!view.isOwner}
                savedViewId={view.isOwner ? view.id : undefined}
                onSavedViewCreated={(id) => router.push(`/view/${id}`)}
              />
            </TabPanel>
            <TabPanel label={translation('tasks')} className="flex-col-0 min-h-48 overflow-auto">
              <PatientViewTasksPanel
                filterDefinitionJson={view.filterDefinition}
                sortDefinitionJson={view.sortDefinition}
                parameters={params}
              />
            </TabPanel>
          </TabSwitcher>
        )}

        {view.baseEntityType === SavedViewEntityType.Task && (
          <TabSwitcher>
            <TabList className="mb-6" />
            <TabPanel label={translation('myTasks')} className="flex-col-0 min-h-48 overflow-auto">
              <SavedTaskViewTab
                key={view.id}
                viewId={view.id}
                filterDefinition={view.filterDefinition}
                sortDefinition={view.sortDefinition}
                parameters={params}
                isOwner={view.isOwner}
              />
            </TabPanel>
            <TabPanel label={translation('patients')} className="flex-col-0 min-h-48 overflow-auto">
              <TaskViewPatientsPanel
                filterDefinitionJson={view.filterDefinition}
                sortDefinitionJson={view.sortDefinition}
                parameters={params}
              />
            </TabPanel>
          </TabSwitcher>
        )}
      </ContentPanel>
    </Page>
  )
}

export default ViewPage
