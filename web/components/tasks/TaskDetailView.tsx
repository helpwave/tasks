import { useCallback } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { type PropertyValueInput } from '@/api/gql/generated'
import { useTask } from '@/data'
import {
  TabList,
  TabPanel,
  TabSwitcher
} from '@helpwave/hightide'
import { PropertyList, type PropertyValue } from '@/components/tables/PropertyList'
import { TaskDataEditor } from './TaskDataEditor'
import { useUpdateTask } from '@/data'
import { buildPropertyValueInputsExcludingDefinition } from '@/utils/propertyValueInputs'

interface TaskDetailViewProps {
  taskId: string | null,
  onClose: () => void,
  onCreateSuccessClose?: () => void,
  onListSync?: () => void,
  initialPatientId?: string,
  initialPatientName?: string,
  onCreateDraftDirtyChange?: (dirty: boolean) => void,
}

export const TaskDetailView = ({ taskId, onClose, onCreateSuccessClose, onListSync, initialPatientId, initialPatientName, onCreateDraftDirtyChange }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()

  const isEditMode = !!taskId

  const { data: taskData } = useTask(
    taskId ?? '',
    { skip: !isEditMode }
  )

  const [updateTask] = useUpdateTask()

  const convertPropertyValueToInput = useCallback((definitionId: string, value: PropertyValue | null): PropertyValueInput | null => {
    if (!value) return null
    return {
      definitionId,
      textValue: value.textValue ?? undefined,
      numberValue: value.numberValue ?? undefined,
      booleanValue: value.boolValue ?? undefined,
      dateValue: value.dateValue?.toISOString().split('T')[0] ?? undefined,
      dateTimeValue: value.dateTimeValue?.toISOString() ?? undefined,
      selectValue: value.singleSelectValue ?? undefined,
      multiSelectValues: value.multiSelectValue ?? undefined,
      userValue: value.userValue ?? undefined,
    }
  }, [])

  const handlePropertyValueChange = useCallback((definitionId: string, value: PropertyValue | null) => {
    if (!isEditMode || !taskId || !taskData) return

    const propertyInputs = buildPropertyValueInputsExcludingDefinition(
      taskData.properties,
      definitionId
    )

    if (value !== null) {
      const newPropertyInput = convertPropertyValueToInput(definitionId, value)
      if (newPropertyInput) {
        propertyInputs.push(newPropertyInput)
      }
    }

    updateTask({
      variables: {
        id: taskId,
        data: {
          properties: propertyInputs,
        },
      },
    })
  }, [isEditMode, taskId, taskData, convertPropertyValueToInput, updateTask])


  return (
    <div className="flex-grow overflow-hidden flex flex-col">
      <TabSwitcher>
        <TabList/>
        <TabPanel label={translation('overview')} className="overflow-hidden h-full" initiallyActive={true}>
          <TaskDataEditor
            id={taskId}
            initialPatientId={initialPatientId}
            initialPatientName={initialPatientName}
            onListSync={onListSync}
            onClose={onClose}
            onCreateSuccessClose={onCreateSuccessClose}
            onCreateDraftDirtyChange={isEditMode ? undefined : onCreateDraftDirtyChange}
          />
        </TabPanel>
        <TabPanel
          label={translation('properties')}
          className="h-full overflow-y-auto pr-2"
          disabled={!isEditMode}
        >
          <div className="flex flex-col gap-4 pt-4">
            <PropertyList
              subjectId={taskId!}
              subjectType="task"
              fullWidthAddButton={true}
              propertyValues={taskData?.properties?.map(p => ({
                ...p,
                definition: {
                  ...p.definition,
                },
              }))}
              onPropertyValueChange={handlePropertyValueChange}
            />
          </div>
        </TabPanel>
      </TabSwitcher>
    </div>
  )
}
