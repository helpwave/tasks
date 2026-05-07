import { useCallback, useState } from 'react'
import { useClearTaskProperty } from '@/data'

export type ClearTaskPropertyState = {
  propertyDefinitionId: string,
  propertyName: string,
}

type TaskPropertyValue = {
  definition: {
    id: string,
  },
}

type TaskForPropertyClear = {
  id: string,
  properties?: TaskPropertyValue[] | null,
}

type UseTaskPropertyClearDialogProps = {
  tasks: TaskForPropertyClear[],
  onRefetch?: () => void,
}

export function useTaskPropertyClearDialog({
  tasks,
  onRefetch,
}: UseTaskPropertyClearDialogProps) {
  const [clearTaskProperty] = useClearTaskProperty()
  const [clearPropertyState, setClearPropertyState] = useState<ClearTaskPropertyState | null>(null)
  const [isClearingProperty, setIsClearingProperty] = useState(false)
  const [clearPropertyProcessedCount, setClearPropertyProcessedCount] = useState(0)
  const [clearPropertyError, setClearPropertyError] = useState<string | null>(null)

  const handleOpenClearProperty = useCallback((propertyDefinitionId: string, propertyName: string) => {
    setClearPropertyError(null)
    setClearPropertyProcessedCount(0)
    setClearPropertyState({ propertyDefinitionId, propertyName })
  }, [])

  const handleCloseClearProperty = useCallback(() => {
    if (isClearingProperty) return
    setClearPropertyState(null)
    setClearPropertyProcessedCount(0)
    setClearPropertyError(null)
  }, [isClearingProperty])

  const handleConfirmClearProperty = useCallback(async () => {
    if (!clearPropertyState || isClearingProperty) return
    const targets = tasks.filter(task => (task.properties ?? []).some(
      property => property.definition.id === clearPropertyState.propertyDefinitionId
    ))
    setClearPropertyError(null)
    setClearPropertyProcessedCount(0)
    setIsClearingProperty(true)

    try {
      if (targets.length > 0) {
        await clearTaskProperty({
          variables: {
            propertyDefinitionId: clearPropertyState.propertyDefinitionId,
            taskIds: targets.map(task => task.id),
          },
        })
      }
      setClearPropertyProcessedCount(targets.length)
      setClearPropertyState(null)
      onRefetch?.()
    } catch (error) {
      setClearPropertyError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsClearingProperty(false)
    }
  }, [clearPropertyState, isClearingProperty, tasks, clearTaskProperty, onRefetch])

  return {
    clearPropertyState,
    isClearingProperty,
    clearPropertyProcessedCount,
    clearPropertyError,
    handleOpenClearProperty,
    handleCloseClearProperty,
    handleConfirmClearProperty,
  }
}
