import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { TaskList, type TaskViewModel } from '@/components/tasks/TaskList'
import { useMemo } from 'react'
import { useGetMyTasksQuery } from '@/api/gql/generated'
import { useRouter } from 'next/router'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { data: queryData, refetch } = useGetMyTasksQuery()
  const taskId = router.query['taskId'] as string | undefined

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!queryData?.me?.tasks) return []

    return queryData.me.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      description: task.description || undefined,
      updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      done: task.done,
      patient: task.patient
        ? {
          id: task.patient.id,
          name: task.patient.name,
          locations: task.patient.assignedLocations || []
        }
        : undefined,
      assignee: task.assignee
        ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl }
        : undefined,
    }))
  }, [queryData])

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={translation('nTask', { count: tasks.length })}
      >
        <TaskList
          tasks={tasks}
          onRefetch={refetch}
          showAssignee={false}
          initialTaskId={taskId}
          onInitialTaskOpened={() => router.replace('/tasks', undefined, { shallow: true })}
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
