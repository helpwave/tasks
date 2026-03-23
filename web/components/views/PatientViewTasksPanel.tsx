'use client'

import { useMemo } from 'react'
import { usePatients } from '@/data'
import { PatientState } from '@/api/gql/generated'
import type { QuerySearchInput } from '@/api/gql/generated'
import { columnFiltersToQueryFilterClauses, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { deserializeColumnFiltersFromView, deserializeSortingFromView } from '@/utils/viewDefinition'
import type { ViewParameters } from '@/utils/viewDefinition'
import { TaskList } from '@/components/tables/TaskList'
import type { TaskViewModel } from '@/components/tables/TaskList'

const ADMITTED_OR_WAITING: PatientState[] = [PatientState.Admitted, PatientState.Wait]

type PatientViewTasksPanelProps = {
  filterDefinitionJson: string,
  sortDefinitionJson: string,
  parameters: ViewParameters,
}

/**
 * Task universe derived from the same patient query as the patient tab (patients matching the
 * saved filters + scope), flattened to tasks — not a separate client hack.
 */
export function PatientViewTasksPanel({
  filterDefinitionJson,
  sortDefinitionJson,
  parameters,
}: PatientViewTasksPanelProps) {
  const filters = deserializeColumnFiltersFromView(filterDefinitionJson)
  const sorting = deserializeSortingFromView(sortDefinitionJson)
  const apiFilters = useMemo(() => columnFiltersToQueryFilterClauses(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToQuerySortClauses(sorting), [sorting])

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

  const patientStates = useMemo(() => {
    const stateFilter = apiFilters.find(f => f.fieldKey === 'state')
    if (!stateFilter?.value) return allPatientStates
    const raw = stateFilter.value.stringValues?.length
      ? stateFilter.value.stringValues
      : stateFilter.value.stringValue
        ? [stateFilter.value.stringValue]
        : []
    if (raw.length === 0) return allPatientStates
    const allowed = new Set(allPatientStates as unknown as string[])
    const filtered = raw.filter(s => allowed.has(s))
    return filtered.length > 0 ? (filtered as PatientState[]) : allPatientStates
  }, [apiFilters, allPatientStates])

  const searchInput: QuerySearchInput | undefined = parameters.searchQuery
    ? { searchText: parameters.searchQuery, includeProperties: true }
    : undefined

  const { data: patientsData, loading, refetch } = usePatients({
    locationId: parameters.locationId,
    rootLocationIds: parameters.rootLocationIds && parameters.rootLocationIds.length > 0 ? parameters.rootLocationIds : undefined,
    states: patientStates,
    filters: apiFilters.length > 0 ? apiFilters : undefined,
    sorts: apiSorting.length > 0 ? apiSorting : undefined,
    search: searchInput,
  })

  const tasks: TaskViewModel[] = useMemo(() => {
    if (!patientsData?.patients) return []
    return patientsData.patients.flatMap(patient => {
      if (!ADMITTED_OR_WAITING.includes(patient.state) || !patient.tasks) return []
      const mergedLocations = [
        ...(patient.clinic ? [patient.clinic] : []),
        ...(patient.position ? [patient.position] : []),
        ...(patient.teams || [])
      ]
      return patient.tasks.map(task => ({
        id: task.id,
        name: task.title,
        description: task.description || undefined,
        updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: task.priority || null,
        estimatedTime: task.estimatedTime ?? null,
        done: task.done,
        patient: {
          id: patient.id,
          name: patient.name,
          locations: mergedLocations
        },
        assignee: task.assignees[0]
          ? { id: task.assignees[0].id, name: task.assignees[0].name, avatarURL: task.assignees[0].avatarUrl, isOnline: task.assignees[0].isOnline ?? null }
          : undefined,
        assigneeTeam: task.assigneeTeam
          ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
          : undefined,
      }))
    })
  }, [patientsData])

  return (
    <TaskList
      tasks={tasks}
      onRefetch={refetch}
      showAssignee={true}
      loading={loading}
    />
  )
}
