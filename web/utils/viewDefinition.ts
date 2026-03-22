import type { ColumnFilter, ColumnFiltersState, SortingState } from '@tanstack/react-table'
import type { DataType, FilterOperator, FilterParameter, FilterValue } from '@helpwave/hightide'

/**
 * Stored JSON alongside filterDefinition / sortDefinition in SavedView.parameters.
 * Location scope and other cross-cutting scope live here (not in separate routes).
 */
export type ViewParameters = {
  rootLocationIds?: string[],
  locationId?: string,
  /** Patient list search (full-text) */
  searchQuery?: string,
  /** Task list: assignee scope (e.g. my tasks page) */
  assigneeId?: string,
}

export function parseViewParameters(json: string): ViewParameters {
  try {
    const v = JSON.parse(json) as unknown
    if (!v || typeof v !== 'object') return {}
    return v as ViewParameters
  } catch {
    return {}
  }
}

export function stringifyViewParameters(p: ViewParameters): string {
  return JSON.stringify(p)
}

/** Same wire format as useStorageSyncedTableState filter serialization. */
export function serializeColumnFiltersForView(filters: ColumnFiltersState): string {
  const mappedColumnFilter = filters.map((filter) => {
    const tableFilterValue = filter.value as FilterValue
    const filterParameter = tableFilterValue.parameter
    const parameter: Record<string, unknown> = {
      ...filterParameter,
      compareDate: filterParameter.compareDate ? filterParameter.compareDate.toISOString() : undefined,
      minDate: filterParameter.minDate ? filterParameter.minDate.toISOString() : undefined,
      maxDate: filterParameter.maxDate ? filterParameter.maxDate.toISOString() : undefined,
    }
    return {
      ...filter,
      id: filter.id,
      value: {
        ...tableFilterValue,
        parameter,
      },
    }
  })
  return JSON.stringify(mappedColumnFilter)
}

export function deserializeColumnFiltersFromView(json: string): ColumnFiltersState {
  try {
    const mappedColumnFilter = JSON.parse(json) as Record<string, unknown>[]
    return mappedColumnFilter.map((filter): ColumnFilter => {
      const value = filter['value'] as Record<string, unknown>
      const parameter = value['parameter'] as Record<string, unknown>
      const filterParameter: FilterParameter = {
        ...parameter,
        compareDate: parameter['compareDate'] ? new Date(parameter['compareDate'] as string) : undefined,
        minDate: parameter['minDate'] ? new Date(parameter['minDate'] as string) : undefined,
        maxDate: parameter['maxDate'] ? new Date(parameter['maxDate'] as string) : undefined,
      } as FilterParameter
      const mappedValue: FilterValue = {
        operator: value['operator'] as FilterOperator,
        dataType: value['dataType'] as DataType,
        parameter: filterParameter,
      }
      return {
        ...filter,
        value: mappedValue,
      } as ColumnFilter
    })
  } catch {
    return []
  }
}

export function serializeSortingForView(sorting: SortingState): string {
  return JSON.stringify(sorting)
}

export function deserializeSortingFromView(json: string): SortingState {
  try {
    const v = JSON.parse(json) as unknown
    if (!Array.isArray(v)) return []
    return v as SortingState
  } catch {
    return []
  }
}
