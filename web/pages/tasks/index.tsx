import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useTasksPaginated } from '@/data'
import { useStorageSyncedTableState } from '@/hooks/useTableState'
import { columnFiltersToQueryFilterClauses, paginationStateToPaginationInput, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { Button, Visibility } from '@helpwave/hightide'
import { SaveViewDialog } from '@/components/views/SaveViewDialog'
import { SavedViewEntityType } from '@/api/gql/generated'
import { serializeColumnFiltersForView, serializeSortingForView, stringifyViewParameters } from '@/utils/viewDefinition'
import type { ColumnFiltersState } from '@tanstack/react-table'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds, user, myTasksCount } = useTasksContext()
  const defaultSorting = useMemo(() => [
    { id: 'done', desc: false },
    { id: 'dueDate', desc: false },
  ], [])
  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
  } = useStorageSyncedTableState('task-list', {
    defaultSorting,
  })

  const baselineFilters = useMemo((): ColumnFiltersState => [], [])
  const filtersChanged = useMemo(
    () => serializeColumnFiltersForView(filters as ColumnFiltersState) !== serializeColumnFiltersForView(baselineFilters),
    [filters, baselineFilters]
  )
  const sortingChanged = useMemo(
    () => serializeSortingForView(sorting) !== serializeSortingForView(defaultSorting),
    [sorting, defaultSorting]
  )

  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
        : undefined,
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
          })}
          onCreated={(id) => router.push(`/view/${id}`)}
        />
        <TaskList
          tasks={tasks}
          onRefetch={refetch}
          showAssignee={false}
          initialTaskId={taskId}
          onInitialTaskOpened={() => router.replace('/tasks', undefined, { shallow: true })}
          totalCount={totalCount}
          loading={tasksLoading}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          saveViewSlot={(
            <Visibility isVisible={filtersChanged || sortingChanged}>
              <Button color="primary" onClick={() => setIsSaveViewOpen(true)}>
                {translation('saveView')}
              </Button>
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
          }}
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
