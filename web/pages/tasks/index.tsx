import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { TaskList } from '@/components/tasks/TaskList'
import { useRouter } from 'next/router'
import { useTasksContext } from '@/hooks/useTasksContext'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const router = useRouter()
  const { selectedRootLocationIds, user, myTasksCount } = useTasksContext()
  const taskId = router.query['taskId'] as string | undefined

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        description={myTasksCount !== undefined ? translation('nTask', { count: myTasksCount }) : undefined}
      >
        <TaskList
          baseVariables={{
            rootLocationIds: selectedRootLocationIds,
            assigneeId: user?.id,
          }}
          showAssignee={false}
          initialTaskId={taskId}
          onInitialTaskOpened={() => router.replace('/tasks', undefined, { shallow: true })}
        />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
