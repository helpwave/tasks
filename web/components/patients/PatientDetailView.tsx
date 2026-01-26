import { useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { PropertyEntity } from '@/api/types'
import { useGetPatientQuery } from '@/api/queries/patients'
import { useGetPropertyDefinitionsQuery } from '@/api/queries/properties'
import { useUpdatePatientMutation } from '@/api/mutations/patients'
import {
  ProgressIndicator,
  TabList,
  TabPanel,
  TabSwitcher,
  Tooltip
} from '@helpwave/hightide'
import { PatientStateChip } from '@/components/patients/PatientStateChip'
import { LocationChips } from '@/components/patients/LocationChips'
import { PatientTasksView } from './PatientTasksView'
import { PatientDataEditor } from './PatientDataEditor'
import { AuditLogTimeline } from '@/components/AuditLogTimeline'
import { PropertyList, type PropertyValue } from '../PropertyList'

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

  const { data: patientData } = useGetPatientQuery(
    { id: patientId! },
    { skip: !isEditMode }
  )

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery({})

  const [updatePatientMutation] = useUpdatePatientMutation(patientId!)

  const availableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return []
    const entity = PropertyEntity.Patient
    return propertyDefinitionsData.propertyDefinitions
      .filter(def => def.isActive && def.allowedEntities.includes(entity))
      .map(def => ({
        id: def.id,
        name: def.name,
        description: def.description || undefined,
        subjectType: (def.allowedEntities[0] || PropertyEntity.Patient) === PropertyEntity.Patient ? 'patient' as const : 'task' as const,
        fieldType: (def.fieldType === 'TEXT' ? 'text' : def.fieldType === 'NUMBER' ? 'number' : def.fieldType === 'CHECKBOX' ? 'checkbox' : def.fieldType === 'DATE' ? 'date' : def.fieldType === 'DATETIME' ? 'dateTime' : def.fieldType === 'SELECT' ? 'singleSelect' : def.fieldType === 'MULTI_SELECT' ? 'multiSelect' : 'text') as 'text' | 'number' | 'checkbox' | 'date' | 'dateTime' | 'singleSelect' | 'multiSelect',
        isArchived: !def.isActive,
        selectData: (def.fieldType === 'SELECT' || def.fieldType === 'MULTI_SELECT') ? {
          isAllowingFreetext: false,
          options: def.options && def.options.length > 0 ? def.options.map((opt, idx) => ({
            id: `${def.id}-opt-${idx}`,
            name: opt,
            description: undefined,
            isCustom: false,
          })) : [],
        } : undefined,
      }))
  }, [propertyDefinitionsData])

  const hasAvailableProperties = useMemo(() => {
    return availableProperties.length > 0
  }, [availableProperties])

  const taskStats: { totalTasks: number, openTasks: number, closedTasks: number, taskProgress: number } = useMemo(() => ({
    totalTasks: patientData?.patient?.tasks?.length ?? 0,
    openTasks: patientData?.patient?.tasks?.filter(task => !task.done).length ?? 0,
    closedTasks: patientData?.patient?.tasks?.filter(task => task.done).length ?? 0,
    taskProgress: patientData?.patient?.tasks?.length ?? 0 > 0 ? (patientData?.patient?.tasks?.filter(task => task.done).length ?? 0) / (patientData?.patient?.tasks?.length ?? 0) : 0,
  }), [patientData?.patient?.tasks])

  const patientName = patientData?.patient ? `${patientData.patient.firstname} ${patientData.patient.lastname}` : ''
  const displayLocation = useMemo(() => {
    if (patientData?.patient?.position) {
      return [patientData.patient.position]
    }
    if (patientData?.patient?.assignedLocations && patientData.patient.assignedLocations.length > 0) {
      return patientData.patient.assignedLocations
    }
    return []
  }, [patientData?.patient?.position, patientData?.patient?.assignedLocations])


  return (
    <div className="flex-col-0 overflow-hidden">
      {isEditMode && patientName && (
        <div className="py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-lg">{patientName}</div>
            <div className="flex items-center gap-2">
              {taskStats.totalTasks > 0 && (
                <Tooltip
                  tooltip={`${translation('openTasks')}: ${taskStats.openTasks}\n${translation('closedTasks')}: ${taskStats.closedTasks}`}
                  position="top"
                  tooltipClassName="whitespace-pre-line"
                >
                  <div className="w-12">
                    <ProgressIndicator progress={taskStats.taskProgress} rotation={-90} />
                  </div>
                </Tooltip>
              )}
              {patientData?.patient?.state && (
                <PatientStateChip state={patientData.patient.state} />
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
        <TabList/>
        {isEditMode && patientId && (
          <TabPanel label={translation('tasks')} className="flex-col-0 px-1 pt-4 pb-16 overflow-y-auto">
            <PatientTasksView
              patientId={patientId}
              patientData={patientData}
              onSuccess={onSuccess}
            />
          </TabPanel>
        )}

        {isEditMode && hasAvailableProperties && patientId && (
          <TabPanel label={translation('properties')} className="flex-col-0 px-1 pt-4 pb-16 overflow-y-auto">
            <PropertyList
              subjectId={patientId}
              subjectType="patient"
              fullWidthAddButton={true}
              propertyValues={patientData?.patient?.properties}
              onPropertyValueChange={(definitionId, value) => {
                const existingProperties = patientData?.patient?.properties?.map(p => ({
                  definitionId: p.definition.id,
                  textValue: p.textValue,
                  numberValue: p.numberValue,
                  booleanValue: p.booleanValue,
                  dateValue: p.dateValue,
                  dateTimeValue: p.dateTimeValue,
                  selectValue: p.selectValue,
                  multiSelectValues: p.multiSelectValues,
                })) || []

                if (value === null) {
                  const updatedProperties = existingProperties.filter(p => p.definitionId !== definitionId)
                  updatePatientMutation({ variables: { id: patientId, data: { properties: updatedProperties } } })
                  return
                }

                const propertyDefinition = propertyDefinitionsData?.propertyDefinitions?.find(def => def.id === definitionId)
                const property = availableProperties.find(ap => ap.id === definitionId)
                const selectData = property?.selectData || (propertyDefinition?.options && propertyDefinition.options.length > 0 ? {
                  options: propertyDefinition.options.map((opt, idx) => ({
                    id: `${definitionId}-opt-${idx}`,
                    name: opt,
                    description: undefined,
                    isCustom: false,
                  })),
                } : undefined)

                let multiSelectValues: string[] | null = null
                if (value.multiSelectValue && value.multiSelectValue.length > 0 && selectData?.options) {
                  multiSelectValues = value.multiSelectValue
                    .map(optionId => {
                      const option = selectData.options.find(opt => opt.id === optionId)
                      return option?.name
                    })
                    .filter((name): name is string => name !== undefined)
                }

                let selectValue: string | null = null
                if (value.singleSelectValue && selectData?.options) {
                  const option = selectData.options.find(opt => opt.id === value.singleSelectValue)
                  selectValue = option?.name || null
                }

                const propertyInput: PropertyValueInput = {
                  definitionId,
                  textValue: value.textValue !== undefined ? (value.textValue !== null && value.textValue.trim() !== '' ? value.textValue : '') : null,
                  numberValue: value.numberValue ?? null,
                  booleanValue: value.boolValue ?? null,
                  dateValue: value.dateValue && !isNaN(value.dateValue.getTime()) ? value.dateValue.toISOString().split('T')[0] : null,
                  dateTimeValue: value.dateTimeValue && !isNaN(value.dateTimeValue.getTime()) ? value.dateTimeValue.toISOString() : null,
                  selectValue,
                  multiSelectValues: multiSelectValues && multiSelectValues.length > 0 ? multiSelectValues : null,
                }

                const updatedProperties = [
                  ...existingProperties.filter(p => p.definitionId !== definitionId),
                  propertyInput,
                ]

                updatePatient({ id: patientId, data: { properties: updatedProperties } })
              }}
            />
          </TabPanel>
        )}

        <TabPanel label={translation('patientData')} className="flex-col-0 px-1 pt-4 pb-16 overflow-y-auto">
          <PatientDataEditor
            id={patientId || null}
            initialCreateData={initialCreateData}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </TabPanel>

        {isEditMode && patientId && (
          <TabPanel label="Audit Log" className="flex-col-0 px-1 pt-4 pb-16 overflow-y-auto">
            <AuditLogTimeline caseId={patientId} enabled={true} />
          </TabPanel>
        )}
      </TabSwitcher>
    </div>
  )
}
