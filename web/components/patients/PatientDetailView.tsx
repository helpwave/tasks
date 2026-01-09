import { useMemo } from 'react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { CreatePatientInput } from '@/api/gql/generated'
import {
  PropertyEntity,
  useGetPatientQuery,
  useGetPropertyDefinitionsQuery
} from '@/api/gql/generated'
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
import { PropertyList } from '../PropertyList'

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
    { enabled: isEditMode }
  )

  const { data: propertyDefinitionsData } = useGetPropertyDefinitionsQuery()

  const hasAvailableProperties = useMemo(() => {
    if (!propertyDefinitionsData?.propertyDefinitions) return false
    return propertyDefinitionsData.propertyDefinitions.some(
      def => def.isActive && def.allowedEntities.includes(PropertyEntity.Patient)
    )
  }, [propertyDefinitionsData])

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
