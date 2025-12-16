import type { NextPage } from 'next'
import { Page } from '@/components/layout/Page'
import titleWrapper from '@/utils/titleWrapper'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { Button } from '@helpwave/hightide'
import { PlusIcon } from 'lucide-react'
import { TaskList, type TaskListRef } from '@/components/tasks/TaskList'
import { useRef } from 'react'

const TasksPage: NextPage = () => {
  const translation = useTasksTranslation()
  const listRef = useRef<TaskListRef>(null)

  return (
    <Page pageTitle={titleWrapper(translation('myTasks'))}>
      <ContentPanel
        titleElement={translation('myTasks')}
        actionElement={(
          <Button startIcon={<PlusIcon />} onClick={() => listRef.current?.openCreate()}>
            {translation('addTask')}
          </Button>
        )}
      >
        <TaskList ref={listRef} />
      </ContentPanel>
    </Page>
  )
}

export default TasksPage
