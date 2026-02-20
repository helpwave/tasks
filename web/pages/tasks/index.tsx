import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { useTasksPaginated } from '@/data'
import { useStorageSyncedTableState } from '@/hooks/useTableState'
import { columnFiltersToFilterInput, paginationStateToPaginationInput, sortingStateToSortInput } from '@/utils/tableStateToApi'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds, user, myTasksCount } = useTasksContext()
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
    defaultSorting: useMemo(() => [
      { id: 'done', desc: false },
      { id: 'dueDate', desc: false },
    ], []),
  })

  const apiFiltering = useMemo(() => columnFiltersToFilterInput(filters, 'task'), [filters])
  const apiSorting = useMemo(() => sortingStateToSortInput(sorting, 'task'), [sorting])
  const apiPagination = useMemo(() => paginationStateToPaginationInput(pagination), [pagination])

  const { data: tasksData, refetch, totalCount, loading: tasksLoading } = useTasksPaginated(
    !!selectedRootLocationIds && !!user
      ? { rootLocationIds: selectedRootLocationIds, assigneeId: user?.id }
      : undefined,
    {
      pagination: apiPagination,
      sorting: apiSorting.length > 0 ? apiSorting : undefined,
      filtering: apiFiltering.length > 0 ? apiFiltering : undefined,
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
        <TaskList
          tasks={tasks}
          onRefetch={refetch}
          showAssignee={false}
          initialTaskId={taskId}
          onInitialTaskOpened={() => router.replace('/tasks', undefined, { shallow: true })}
          totalCount={totalCount}
          loading={tasksLoading}
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
