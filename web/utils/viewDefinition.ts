import type {
  ColumnFilter,
  ColumnFiltersState,
  ColumnOrderState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import type { DataType, FilterOperator, FilterParameter, FilterValue } from '@helpwave/hightide'

export type ViewParameters = {
  rootLocationIds?: string[],
  locationId?: string,
  searchQuery?: string,
  assigneeId?: string,
  columnVisibility?: VisibilityState,
  columnOrder?: ColumnOrderState,
}

export function hasActiveLocationFilter(filters: ColumnFiltersState): boolean {
  return filters.some(f => {
    if (f.id !== 'position' && f.id !== 'locationSubtree') return false
    const v = f.value as FilterValue | undefined
    if (!v?.parameter) return false
    const p = v.parameter
    if (p.uuidValue != null && String(p.uuidValue) !== '') return true
    if (Array.isArray(p.uuidValues) && p.uuidValues.length > 0) return true
    return false
  })
}

export function normalizedVisibilityForViewCompare(v: VisibilityState): string {
  const keys = Object.keys(v).sort()
  const sorted: Record<string, boolean> = {}
  for (const k of keys) {
    sorted[k] = v[k] as boolean
  }
  return JSON.stringify(sorted)
}

export function visibilityMatchesViewBaseline(
  current: VisibilityState,
  baseline: VisibilityState | undefined
): boolean {
  return normalizedVisibilityForViewCompare(current) === normalizedVisibilityForViewCompare(baseline ?? {})
}

export function expandVisibilityWithPropertyColumnDefaults(
  v: VisibilityState,
  propertyColumnIds: readonly string[]
): VisibilityState {
  if (propertyColumnIds.length === 0) {
    return v
  }
  const out: VisibilityState = { ...v }
  for (const id of propertyColumnIds) {
    if (!(id in out)) {
      out[id] = false
    }
  }
  return out
}

export function visibilityMatchesViewBaselineForDirty(
  current: VisibilityState,
  baseline: VisibilityState | undefined,
  propertyColumnIds: readonly string[]
): boolean {
  const base = baseline ?? {}
  return normalizedVisibilityForViewCompare(
    expandVisibilityWithPropertyColumnDefaults(current, propertyColumnIds)
  ) === normalizedVisibilityForViewCompare(
    expandVisibilityWithPropertyColumnDefaults(base, propertyColumnIds)
  )
}

export function normalizedColumnOrderForViewCompare(order: ColumnOrderState): string {
  return JSON.stringify(order)
}

export function columnOrderMatchesViewBaseline(
  current: ColumnOrderState,
  baseline: ColumnOrderState | undefined
): boolean {
  return normalizedColumnOrderForViewCompare(current) === normalizedColumnOrderForViewCompare(baseline ?? [])
}

export function columnOrderMatchesBaselineForDirty(
  current: ColumnOrderState,
  baseline: ColumnOrderState | undefined
): boolean {
  const b = baseline ?? []
  if (b.length === 0) {
    return true
  }
  return normalizedColumnOrderForViewCompare(current) === normalizedColumnOrderForViewCompare(b)
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

/** Wire format for `filterDefinition` on saved views (JSON string). */
export function serializeColumnFiltersForView(filters: ColumnFiltersState): string {
  const mappedColumnFilter = filters.map((filter) => {
    const tableFilterValue = filter.value as FilterValue
    const filterParameter = tableFilterValue.parameter
    const parameter: Record<string, unknown> = {
      ...filterParameter,
      dateValue: filterParameter.dateValue ? filterParameter.dateValue.toISOString() : undefined,
      dateMin: filterParameter.dateMin ? filterParameter.dateMin.toISOString() : undefined,
      dateMax: filterParameter.dateMax ? filterParameter.dateMax.toISOString() : undefined,
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
      const filterId = filter['id']
      const resolvedId = filterId === 'locationSubtree' ? 'position' : filterId
      const value = filter['value'] as Record<string, unknown>
      const parameter = value['parameter'] as Record<string, unknown>
      const dateValueRaw = parameter['dateValue'] ?? parameter['compareDate']
      const dateMinRaw = parameter['dateMin'] ?? parameter['minDate']
      const dateMaxRaw = parameter['dateMax'] ?? parameter['maxDate']
      const parseStoredDate = (raw: unknown): Date | undefined => {
        if (raw == null || raw === '') return undefined
        const d = new Date(String(raw))
        return Number.isNaN(d.getTime()) ? undefined : d
      }
      const filterParameter: FilterParameter = {
        stringValue: (parameter['stringValue'] ?? parameter['searchText']) as string | undefined,
        numberValue: (parameter['numberValue'] ?? parameter['compareValue']) as number | undefined,
        numberMin: (parameter['numberMin'] ?? parameter['minNumber']) as number | undefined,
        numberMax: (parameter['numberMax'] ?? parameter['maxNumber']) as number | undefined,
        booleanValue: parameter['booleanValue'] as boolean | undefined,
        dateValue: parseStoredDate(dateValueRaw),
        dateMin: parseStoredDate(dateMinRaw),
        dateMax: parseStoredDate(dateMaxRaw),
        uuidValue: parameter['uuidValue'] ?? parameter['singleOptionSearch'],
        uuidValues: (parameter['uuidValues'] ?? parameter['multiOptionSearch']) as unknown[] | undefined,
      }
      const mappedValue: FilterValue = {
        operator: value['operator'] as FilterOperator,
        dataType: value['dataType'] as DataType,
        parameter: filterParameter,
      }
      return {
        ...filter,
        id: resolvedId as string,
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

export function tableViewStateMatchesBaseline(params: {
  filters: ColumnFiltersState,
  baselineFilters: ColumnFiltersState,
  sorting: SortingState,
  baselineSorting: SortingState,
  searchQuery: string,
  baselineSearch: string,
  columnVisibility: VisibilityState,
  baselineColumnVisibility: VisibilityState | undefined,
  columnOrder: ColumnOrderState,
  baselineColumnOrder: ColumnOrderState | undefined,
  propertyColumnIds: readonly string[],
}): boolean {
  const filtersMatch =
    serializeColumnFiltersForView(params.filters) === serializeColumnFiltersForView(params.baselineFilters)
  const sortMatch =
    serializeSortingForView(params.sorting) === serializeSortingForView(params.baselineSorting)
  const searchMatch = params.searchQuery === params.baselineSearch
  const visMatch = visibilityMatchesViewBaselineForDirty(
    params.columnVisibility,
    params.baselineColumnVisibility,
    params.propertyColumnIds
  )
  const orderMatch = columnOrderMatchesBaselineForDirty(params.columnOrder, params.baselineColumnOrder)
  return filtersMatch && sortMatch && searchMatch && visMatch && orderMatch
}
