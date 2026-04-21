'use client'

import { useMemo } from 'react'
import { useTasks } from '@/data'
import { PatientState, type GetTasksQuery } from '@/api/gql/generated'
import { columnFiltersToQueryFilterClauses, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import {
  deserializeColumnFiltersFromView,
  deserializeSortingFromView,
  parseViewParameters
} from '@/utils/viewDefinition'
import type { ViewParameters } from '@/utils/viewDefinition'
import { LoadingContainer } from '@helpwave/hightide'
import { PatientList } from '@/components/tables/PatientList'
import type { PatientViewModel } from '@/components/tables/PatientList'

const ADMITTED_OR_WAITING: PatientState[] = [PatientState.Admitted, PatientState.Wait]

type TaskPatient = NonNullable<GetTasksQuery['tasks'][0]['patient']>

function buildEmbeddedPatientsFromTasks(tasks: GetTasksQuery['tasks']): PatientViewModel[] {
  const agg = new Map<string, { patient: TaskPatient, open: number, closed: number }>()
  for (const t of tasks) {
    if (!t.patient) continue
    const id = t.patient.id
    let row = agg.get(id)
    if (!row) {
      row = { patient: t.patient, open: 0, closed: 0 }
      agg.set(id, row)
    }
    if (t.done) row.closed += 1
    else row.open += 1
  }
  return [...agg.values()].map(({ patient, open, closed }) => {
    const countForAggregate = ADMITTED_OR_WAITING.includes(patient.state)
    return {
      id: patient.id,
      name: patient.name,
      firstname: patient.firstname,
      lastname: patient.lastname,
      birthdate: new Date(patient.birthdate),
      sex: patient.sex,
      state: patient.state,
      clinic: patient.clinic,
      position: patient.position,
      openTasksCount: countForAggregate ? open : 0,
      closedTasksCount: countForAggregate ? closed : 0,
      tasks: [],
      properties: patient.properties ?? [],
    }
  })
}

type TaskViewPatientsPanelProps = {
  filterDefinitionJson: string,
  sortDefinitionJson: string,
  parameters: ViewParameters,
  relatedFilterDefinitionJson: string,
  relatedSortDefinitionJson: string,
  relatedParametersJson: string,
  savedViewId?: string,
  isOwner: boolean,
}

export function TaskViewPatientsPanel({
  filterDefinitionJson,
  sortDefinitionJson,
  parameters,
  relatedFilterDefinitionJson,
  relatedSortDefinitionJson,
  relatedParametersJson,
  savedViewId,
  isOwner,
}: TaskViewPatientsPanelProps) {
  const filters = deserializeColumnFiltersFromView(filterDefinitionJson)
  const sorting = deserializeSortingFromView(sortDefinitionJson)
  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])

  const { data, loading } = useTasks(
    {
      rootLocationIds: parameters.rootLocationIds,
      assigneeId: parameters.assigneeId,
      filters: apiFilters.length > 0 ? apiFilters : undefined,
      sorts: apiSorting.length > 0 ? apiSorting : undefined,
    },
    {
      skip: !parameters.rootLocationIds?.length && !parameters.assigneeId,
    }
  )

  const embeddedPatients = useMemo(
    () => buildEmbeddedPatientsFromTasks(data?.tasks ?? []),
    [data?.tasks]
  )

  const defaultRelatedFilters = useMemo(
    () => deserializeColumnFiltersFromView(relatedFilterDefinitionJson),
    [relatedFilterDefinitionJson]
  )
  const defaultRelatedSorting = useMemo(
    () => deserializeSortingFromView(relatedSortDefinitionJson),
    [relatedSortDefinitionJson]
  )
  const relatedParams = useMemo(
    () => parseViewParameters(relatedParametersJson),
    [relatedParametersJson]
  )

  if (loading && embeddedPatients.length === 0) {
    return (
      <div className="min-h-48 flex items-center justify-center w-full">
        <LoadingContainer className="w-full min-h-48" />
      </div>
    )
  }

  return (
    <PatientList
      embedded
      derivedVirtualMode
      savedViewScope="related"
      embeddedPatients={embeddedPatients}
      rootLocationIds={parameters.rootLocationIds}
      locationId={parameters.locationId}
      viewDefaultFilters={defaultRelatedFilters}
      viewDefaultSorting={defaultRelatedSorting}
      viewDefaultSearchQuery={relatedParams.searchQuery}
      viewDefaultColumnVisibility={relatedParams.columnVisibility}
      viewDefaultColumnOrder={relatedParams.columnOrder}
      hideSaveView={!isOwner}
      savedViewId={isOwner ? savedViewId : undefined}
    />
  )
}
