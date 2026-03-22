'use client'

import { useMemo } from 'react'
import { usePatients } from '@/data'
import { PatientState } from '@/api/gql/generated'
import type { FullTextSearchInput } from '@/api/gql/generated'
import { columnFiltersToFilterInput, sortingStateToSortInput } from '@/utils/tableStateToApi'
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
  const apiFiltering = useMemo(() => columnFiltersToFilterInput(filters), [filters])
  const apiSorting = useMemo(() => sortingStateToSortInput(sorting), [sorting])

  const allPatientStates: PatientState[] = useMemo(() => [
    PatientState.Admitted,
    PatientState.Discharged,
    PatientState.Dead,
    PatientState.Wait,
  ], [])

  const patientStates = useMemo(() => {
    const stateFilter = apiFiltering.find(
      f => f.column === 'state' &&
        (f.operator === 'TAGS_SINGLE_EQUALS' || f.operator === 'TAGS_SINGLE_CONTAINS') &&
        f.parameter?.searchTags != null &&
        f.parameter.searchTags.length > 0
    )
    if (!stateFilter?.parameter?.searchTags) return allPatientStates
    const allowed = new Set(allPatientStates as unknown as string[])
    const filtered = (stateFilter.parameter.searchTags as string[]).filter(s => allowed.has(s))
    return filtered.length > 0 ? (filtered as PatientState[]) : allPatientStates
  }, [apiFiltering, allPatientStates])

  const searchInput: FullTextSearchInput | undefined = parameters.searchQuery
    ? { searchText: parameters.searchQuery, includeProperties: true }
    : undefined

  const { data: patientsData, loading, refetch } = usePatients({
    locationId: parameters.locationId,
    rootLocationIds: parameters.rootLocationIds && parameters.rootLocationIds.length > 0 ? parameters.rootLocationIds : undefined,
    states: patientStates,
    filtering: apiFiltering.length > 0 ? apiFiltering : undefined,
    sorting: apiSorting.length > 0 ? apiSorting : undefined,
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
        assignee: task.assignee
          ? { id: task.assignee.id, name: task.assignee.name, avatarURL: task.assignee.avatarUrl, isOnline: task.assignee.isOnline ?? null }
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
