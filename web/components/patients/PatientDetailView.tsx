import { useMemo, useCallback } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput, PropertyValueInput } from '@/api/gql/generated'
import { usePatient } from '@/data'
import {
  ProgressIndicator,
  TabList,
  TabPanel,
  TabSwitcher,
  Tooltip
} from '@helpwave/hightide'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { LocationChips } from '@/components/locations/LocationChips'
import { PatientTasksView } from './PatientTasksView'
import { PatientDataEditor } from './PatientDataEditor'
import { AuditLogTimeline } from '@/components/AuditLogTimeline'
import { PropertyList, type PropertyValue } from '../tables/PropertyList'
import { useUpdatePatient } from '@/data'

export const toISODate = (d: Date | string | null | undefined): string | null => {
  if (!d) return null
  const date = typeof d === 'string' ? new Date(d) : d
  if (!(date instanceof Date) || isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const localToUTCWithSameTime = (d: Date | null | undefined): Date | null => {
  if (!d) return null
  return new Date(Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  ))
}

interface PatientDetailViewProps {
  patientId?: string,
  onClose: () => void,
  onSuccess: () => void,
  initialCreateData?: Partial<CreatePatientInput>,
}

export const PatientDetailView = ({
  patientId,
  onClose,
  onSuccess,
  initialCreateData = {}
}: PatientDetailViewProps) => {
  const translation = useTasksTranslation()

  const isEditMode = !!patientId

  const { data: patientData } = usePatient(
    patientId ?? '',
    { skip: !isEditMode }
  )

  const [updatePatient] = useUpdatePatient()

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
    if (!isEditMode || !patientId || !patientData) return

    const currentProperties = patientData.properties || []
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
          userValue: (prop as { userValue?: string | null }).userValue ?? undefined,
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

    updatePatient({
      variables: {
        id: patientId,
        data: {
          properties: propertyInputs,
        },
      },
      onCompleted: () => onSuccess(),
    })
  }, [isEditMode, patientId, patientData, convertPropertyValueToInput, updatePatient, onSuccess])

  const taskStats: { totalTasks: number, openTasks: number, closedTasks: number, taskProgress: number } = useMemo(() => ({
    totalTasks: patientData?.tasks?.length ?? 0,
    openTasks: patientData?.tasks?.filter(task => !task.done).length ?? 0,
    closedTasks: patientData?.tasks?.filter(task => task.done).length ?? 0,
    taskProgress: patientData?.tasks?.length ?? 0 > 0 ? (patientData?.tasks?.filter(task => task.done).length ?? 0) / (patientData?.tasks?.length ?? 0) : 0,
  }), [patientData?.tasks])

  const patientName = patientData ? `${patientData.firstname} ${patientData.lastname}` : ''
  const displayLocation = useMemo(() => {
    if (patientData?.position) {
      return [patientData.position]
    }
    if (patientData?.assignedLocations && patientData.assignedLocations.length > 0) {
      return patientData.assignedLocations
    }
    return []
  }, [patientData?.position, patientData?.assignedLocations])


  return (
    <div className="flex-col-0 overflow-hidden">
      {isEditMode && patientName && (
        <div className="py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">{patientName}</div>
            <div className="flex items-center gap-2">
              {taskStats.totalTasks > 0 && (
                <Tooltip
                  tooltip={(
                    <div className="flex-col-0">
                      <span>{`${translation('openTasks')}: ${taskStats.openTasks}`}</span>
                      <span>{`${translation('closedTasks')}: ${taskStats.closedTasks}`}</span>
                    </div>
                  )}
                  alignment="top"
                >
                  <div className="w-12">
                    <ProgressIndicator progress={taskStats.taskProgress} rotation={-90} />
                  </div>
                </Tooltip>
              )}
              {patientData?.state && (
                <PatientStateChip state={patientData.state} />
              )}
            </div>
          </div>
          {displayLocation.length > 0 && (
            <div className="flex items-center gap-1">
              <LocationChips locations={displayLocation} disableLink={false} />
            </div>
          )}
        </div>
      )}
      <TabSwitcher>
        <TabList />
        <TabPanel label={translation('tasks')} className="flex-col-0 flex-1overflow-hidden h-full" disabled={!(isEditMode && patientId)}>
          {patientId && (
            <PatientTasksView
              patientId={patientId}
              patientData={patientData ? { patient: patientData } : undefined}
              onSuccess={onSuccess}
            />
          )}
        </TabPanel>

        <TabPanel label={translation('properties')} className="flex-col-0 px-2 pt-4 overflow-y-auto" disabled={!(isEditMode && patientId)}>
          {patientId && (
            <PropertyList
              subjectId={patientId}
              subjectType="patient"
              fullWidthAddButton={true}
              propertyValues={patientData?.properties}
              onPropertyValueChange={handlePropertyValueChange}
            />
          )}
        </TabPanel>

        <TabPanel label={translation('patientData')} className="flex-col-0">
          <PatientDataEditor
            id={patientId || null}
            initialCreateData={initialCreateData}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </TabPanel>

        <TabPanel label="Audit Log" className="flex-col-0 px-2 pt-4 overflow-y-auto" disabled={!(isEditMode && patientId)}>
          {patientId && (
            <AuditLogTimeline caseId={patientId} enabled={true} />
          )}
        </TabPanel>
      </TabSwitcher>
    </div>
  )
}
