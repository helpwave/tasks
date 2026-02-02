import { useMemo, useCallback } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PropertyEntity, type PropertyValueInput } from '@/api/gql/generated'
import { usePropertyDefinitions, useTask } from '@/data'
import {
  TabList,
  TabPanel,
  TabSwitcher
} from '@helpwave/hightide'
import { PropertyList, type PropertyValue } from '@/components/tables/PropertyList'
import { TaskDataEditor } from './TaskDataEditor'
import { useUpdateTask } from '@/data'

interface TaskDetailViewProps {
  taskId: string | null,
  onClose: () => void,
  onSuccess: () => void,
  initialPatientId?: string,
}

export const TaskDetailView = ({ taskId, onClose, onSuccess, initialPatientId }: TaskDetailViewProps) => {
  const translation = useTasksTranslation()

  const isEditMode = !!taskId

  const { data: taskData } = useTask(
    taskId ?? '',
    { skip: !isEditMode }
  )

  const { data: propertyDefinitionsData } = usePropertyDefinitions()

  const [updateTask] = useUpdateTask()

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Task)
    )
  }, [propertyDefinitionsData])

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
    }
  }, [])

  const handlePropertyValueChange = useCallback((definitionId: string, value: PropertyValue | null) => {
    if (!isEditMode || !taskId || !taskData) return

    const currentProperties = taskData.properties || []
    const propertyInputs: PropertyValueInput[] = []

    // Add all existing properties except the one being changed
    for (const prop of currentProperties) {
      if (prop.definition.id !== definitionId) {
        propertyInputs.push({
          definitionId: prop.definition.id,
          textValue: prop.textValue ?? undefined,
          numberValue: prop.numberValue ?? undefined,
          booleanValue: prop.booleanValue ?? undefined,
          dateValue: prop.dateValue ?? undefined,
          dateTimeValue: prop.dateTimeValue ?? undefined,
          selectValue: prop.selectValue ?? undefined,
          multiSelectValues: prop.multiSelectValues ?? undefined,
        })
      }
    }

    // Add the changed property if it's not null
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
      onCompleted: () => onSuccess(),
    })
  }, [isEditMode, taskId, taskData, convertPropertyValueToInput, updateTask, onSuccess])


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
        )}
      </TabSwitcher>
    </div>
  )
}
