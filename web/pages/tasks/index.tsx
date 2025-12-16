import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { TaskList, type TaskListRef, type TaskViewModel } from '@/components/tasks/TaskList'
import { useMemo, useRef } from 'react'
import { useGetMyTasksQuery } from '@/api/gql/generated'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const listRef = useRef<TaskListRef>(null)
  const { data: queryData, refetch } = useGetMyTasksQuery()

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
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={() => listRef.current?.openCreate()}>
            {translation('addTask')}
          </Button>
        )}
      >
        <TaskList
          ref={listRef}
          tasks={tasks}
          onRefetch={refetch}
          showAssignee={false}
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
