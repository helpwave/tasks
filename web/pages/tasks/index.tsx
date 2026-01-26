import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import type { TaskViewModel } from '@/components/tables/TaskList'
import { TaskList } from '@/components/tables/TaskList'
import { useMemo } from 'react'
import { GetTasksDocument, type GetTasksQuery, type FullTextSearchInput } from '@/api/gql/generated'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'
import { usePaginatedGraphQLQuery } from '@/hooks/usePaginatedQuery'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds, user, myTasksCount } = useTasksContext()
  const { data: tasksData, refetch, totalCount } = usePaginatedGraphQLQuery<GetTasksQuery, GetTasksQuery['tasks'][0], { rootLocationIds?: string[], assigneeId?: string, search?: FullTextSearchInput }>({
    queryKey: ['GetTasks'],
    document: GetTasksDocument,
    baseVariables: {
      rootLocationIds: selectedRootLocationIds,
      assigneeId: user?.id,
    },
    pageSize: 50,
    extractItems: (result) => result.tasks,
    extractTotalCount: (result) => result.tasksTotal ?? undefined,
    mode: 'infinite',
    enabled: !!selectedRootLocationIds && !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
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
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
