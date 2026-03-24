'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useTasks } from '@/data'
import { columnFiltersToQueryFilterClauses, sortingStateToQuerySortClauses } from '@/utils/tableStateToApi'
import { deserializeColumnFiltersFromView, deserializeSortingFromView } from '@/utils/viewDefinition'
import type { ViewParameters } from '@/utils/viewDefinition'
import { LocationChips } from '@/components/locations/LocationChips'
import { LoadingContainer } from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type TaskViewPatientsPanelProps = {
  filterDefinitionJson: string,
  sortDefinitionJson: string,
  parameters: ViewParameters,
}

type DistinctPatientRow = {
  id: string,
  name: string,
  locations: Array<{ id: string, title: string }>,
}

/**
 * Distinct patients from the same task query as the task tab (no duplicate task-fetch hack).
 */
export function TaskViewPatientsPanel({
  filterDefinitionJson,
  sortDefinitionJson,
  parameters,
}: TaskViewPatientsPanelProps) {
  const translation = useTasksTranslation()
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

  const rows = useMemo((): DistinctPatientRow[] => {
    const map = new Map<string, DistinctPatientRow>()
    for (const t of data?.tasks ?? []) {
      if (!t.patient) continue
      if (!map.has(t.patient.id)) {
        map.set(t.patient.id, {
          id: t.patient.id,
          name: t.patient.name,
          locations: (t.patient.assignedLocations ?? []).map(l => ({ id: l.id, title: l.title })),
        })
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  if (loading) {
    return <LoadingContainer className="w-full min-h-48" />
  }

  return (
    <div className="flex flex-col gap-3 min-h-48">
      <p className="typography-body-sm text-description">{translation('viewDerivedPatientsHint')}</p>
      <ul className="flex flex-col gap-2">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-divider px-3 py-2"
          >
            <Link className="text-primary font-semibold hover:underline" href={`/patients?patientId=${p.id}`}>
              {p.name}
            </Link>
            <LocationChips locations={p.locations} small />
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <span className="typography-body-sm text-description">{translation('noPatientsInTaskView')}</span>
      )}
    </div>
  )
}
