import { useCallback, useState } from 'react'
import { useClearPatientProperty } from '@/data'

export type ClearPatientPropertyState = {
  propertyDefinitionId: string,
  propertyName: string,
}

type PatientPropertyValue = {
  definition: {
    id: string,
  },
}

type PatientForPropertyClear = {
  id: string,
  properties?: PatientPropertyValue[] | null,
}

type UsePatientPropertyClearDialogProps = {
  patients: PatientForPropertyClear[],
  onRefetch?: () => void,
}

export function usePatientPropertyClearDialog({
  patients,
  onRefetch,
}: UsePatientPropertyClearDialogProps) {
  const [clearPatientProperty] = useClearPatientProperty()
  const [clearPropertyState, setClearPropertyState] = useState<ClearPatientPropertyState | null>(null)
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
    const targets = patients.filter(patient => (patient.properties ?? []).some(
      property => property.definition.id === clearPropertyState.propertyDefinitionId
    ))
    setClearPropertyError(null)
    setClearPropertyProcessedCount(0)
    setIsClearingProperty(true)

    try {
      if (targets.length > 0) {
        await clearPatientProperty({
          variables: {
            propertyDefinitionId: clearPropertyState.propertyDefinitionId,
            patientIds: targets.map(patient => patient.id),
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
  }, [clearPropertyState, isClearingProperty, patients, clearPatientProperty, onRefetch])

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
