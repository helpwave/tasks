import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { usePropertyDefinitions, useTasksPaginated } from '@/data'
import { getPropertyColumnIds } from '@/hooks/usePropertyColumnVisibility'
import { PropertyEntity } from '@/api/gql/generated'
import { columnFiltersToQueryFilterClauses, paginationStateToPaginationInput, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { Visibility } from '@helpwave/hightide'
import { SaveViewDialog } from '@/components/views/SaveViewDialog'
import { SaveViewActionsMenu } from '@/components/views/SaveViewActionsMenu'
import { SavedViewEntityType } from '@/api/gql/generated'
import {
  serializeColumnFiltersForView,
  serializeSortingForView,
  stringifyViewParameters,
  tableViewStateMatchesBaseline
} from '@/utils/viewDefinition'
import type { ColumnFiltersState, ColumnOrderState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds, user, myTasksCount } = useTasksContext()
  const { data: propertyDefinitionsData } = usePropertyDefinitions()
  const propertyColumnIds = useMemo(
    () => getPropertyColumnIds(propertyDefinitionsData, PropertyEntity.Task),
    [propertyDefinitionsData]
  )
  const defaultSorting = useMemo(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ], [])
  const [pagination, setPagination] = useState<PaginationState>({ pageSize: 10, pageIndex: 0 })
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  const baselineFilters = useMemo((): ColumnFiltersState => [], [])

  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const viewMatchesBaseline = useMemo(
    () => tableViewStateMatchesBaseline({
      filters: filters as ColumnFiltersState,
      baselineFilters,
      sorting,
      baselineSorting: defaultSorting,
      searchQuery,
      baselineSearch: '',
      columnVisibility,
      baselineColumnVisibility: undefined,
      columnOrder,
      baselineColumnOrder: undefined,
      propertyColumnIds,
    }),
    [
      filters,
      baselineFilters,
      sorting,
      defaultSorting,
      searchQuery,
      columnVisibility,
      columnOrder,
      propertyColumnIds,
    ]
  )
  const hasUnsavedViewChanges = !viewMatchesBaseline

  const handleDiscardTasksView = useCallback(() => {
    setFilters(baselineFilters)
    setSorting(defaultSorting)
    setSearchQuery('')
    setColumnVisibility({})
    setColumnOrder([])
  }, [baselineFilters, defaultSorting])

  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])
  const apiPagination = useMemo(() => paginationStateToPaginationInput(pagination), [pagination])
  const searchInput = searchQuery
    ? { searchText: searchQuery, includeProperties: true }
    : undefined

  const { data: tasksData, refetch, totalCount, loading: tasksLoading } = useTasksPaginated(
    !!selectedRootLocationIds && !!user
      ? { rootLocationIds: selectedRootLocationIds, assigneeId: user?.id }
      : undefined,
    {
      pagination: apiPagination,
      sorts: apiSorting.length > 0 ? apiSorting : undefined,
      filters: apiFilters.length > 0 ? apiFilters : undefined,
      search: searchInput,
    }
  )
  const taskId = router.query['taskId'] as string | undefined

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
      assignee: task.assignees[0]
        ? { id: task.assignees[0].id, name: task.assignees[0].name, avatarURL: task.assignees[0].avatarUrl, isOnline: task.assignees[0].isOnline ?? null }
        : undefined,
      assigneeTeam: task.assigneeTeam
        ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
        : undefined,
      additionalAssigneeCount:
        !task.assigneeTeam && task.assignees.length > 1 ? task.assignees.length - 1 : 0,
      properties: task.properties ?? [],
    }))
  }, [tasksData])

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={myTasksCount !== undefined ? translation('nTask', { count: myTasksCount }) : undefined}
      >
        <SaveViewDialog
          isOpen={isSaveViewOpen}
          onClose={() => setIsSaveViewOpen(false)}
          baseEntityType={SavedViewEntityType.Task}
          filterDefinition={serializeColumnFiltersForView(filters as ColumnFiltersState)}
          sortDefinition={serializeSortingForView(sorting)}
          parameters={stringifyViewParameters({
            rootLocationIds: selectedRootLocationIds ?? undefined,
            assigneeId: user?.id,
            columnVisibility,
            columnOrder,
          })}
          presentation="fromSystemList"
          onCreated={(id) => router.push(`/view/${id}`)}
        />
        <TaskList
          tasks={tasks}
          onRefetch={refetch}
          showAssignee={true}
          initialTaskId={taskId}
          onInitialTaskOpened={() => router.replace('/tasks', undefined, { shallow: true })}
          totalCount={totalCount}
          loading={tasksLoading}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          saveViewSlot={(
            <Visibility isVisible={hasUnsavedViewChanges}>
              <SaveViewActionsMenu
                canOverwrite={false}
                onOverwrite={() => undefined}
                onOpenSaveAsNew={() => setIsSaveViewOpen(true)}
                onDiscard={handleDiscardTasksView}
              />
            </Visibility>
          )}
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
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
