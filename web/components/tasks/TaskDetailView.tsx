import { useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PropertyEntity } from '@/api/types'
import { useGetPropertyDefinitionsQuery } from '@/api/queries/properties'
import { useGetTaskQuery } from '@/api/queries/tasks'
import {
  TabList,
  TabPanel,
  TabSwitcher
} from '@helpwave/hightide'
import { PropertyList } from '@/components/PropertyList'
import { TaskDataEditor } from './TaskDataEditor'

interface TaskDetailViewProps {
  taskId: string | null,
  onClose: () => void,
  onSuccess: () => void,
  initialPatientId?: string,
}

export const TaskDetailView = ({ taskId, onClose, onSuccess, initialPatientId }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()

  const isEditMode = !!taskId

  const { data: taskData } = useGetTaskQuery(
    { id: taskId! },
    {
      skip: !isEditMode,
      fetchPolicy: 'cache-and-network',
    }
  )

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery({})

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
    )
  }, [propertyDefinitionsData])


  return (
    <div className="flex-grow overflow-hidden flex flex-col">
      <TabSwitcher>
        <TabList/>
        <TabPanel label={translation('overview')} className="h-full overflow-y-auto px-1">
          <TaskDataEditor
            id={taskId}
            initialPatientId={initialPatientId}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </TabPanel>
        {isEditMode && hasAvailableProperties && (
          <TabPanel label={translation('properties')} className="h-full overflow-y-auto pr-2">
            <div className="flex flex-col gap-4 pt-4">
              <PropertyList
                subjectId={taskId!}
                subjectType="task"
                fullWidthAddButton={true}
                propertyValues={taskData?.task?.properties?.map(p => ({
                  ...p,
                  definition: {
                    ...p.definition,
                  },
                }))}
              />
            </div>
          </TabPanel>
        )}
      </TabSwitcher>
    </div>
  )
}
