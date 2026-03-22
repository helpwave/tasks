import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import type { QueryFilterClauseInput, QueryFilterValueInput, QuerySortClauseInput } from '@/api/gql/generated'
import { QueryOperator, SortDirection } from '@/api/gql/generated'
import type { DataType, FilterValue, FilterOperator as HightideFilterOperator } from '@helpwave/hightide'

const TABLE_OPERATOR_TO_QUERY: Record<DataType, Partial<Record<HightideFilterOperator, QueryOperator>>> = {
  text: {
    equals: QueryOperator.Eq,
    notEquals: QueryOperator.Neq,
    contains: QueryOperator.Contains,
    notContains: QueryOperator.Neq,
    startsWith: QueryOperator.StartsWith,
    endsWith: QueryOperator.EndsWith,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  number: {
    equals: QueryOperator.Eq,
    notEquals: QueryOperator.Neq,
    greaterThan: QueryOperator.Gt,
    greaterThanOrEqual: QueryOperator.Gte,
    lessThan: QueryOperator.Lt,
    lessThanOrEqual: QueryOperator.Lte,
    between: QueryOperator.Between,
    notBetween: QueryOperator.Neq,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  date: {
    equals: QueryOperator.Eq,
    notEquals: QueryOperator.Neq,
    greaterThan: QueryOperator.Gt,
    greaterThanOrEqual: QueryOperator.Gte,
    lessThan: QueryOperator.Lt,
    lessThanOrEqual: QueryOperator.Lte,
    between: QueryOperator.Between,
    notBetween: QueryOperator.Neq,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  dateTime: {
    equals: QueryOperator.Eq,
    notEquals: QueryOperator.Neq,
    greaterThan: QueryOperator.Gt,
    greaterThanOrEqual: QueryOperator.Gte,
    lessThan: QueryOperator.Lt,
    lessThanOrEqual: QueryOperator.Lte,
    between: QueryOperator.Between,
    notBetween: QueryOperator.Neq,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  boolean: {
    isTrue: QueryOperator.Eq,
    isFalse: QueryOperator.Eq,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  singleTag: {
    equals: QueryOperator.Eq,
    notEquals: QueryOperator.Neq,
    contains: QueryOperator.In,
    notContains: QueryOperator.Neq,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  multiTags: {
    equals: QueryOperator.AllIn,
    notEquals: QueryOperator.Neq,
    contains: QueryOperator.AnyIn,
    notContains: QueryOperator.NoneIn,
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
  unknownType: {
    isNotUndefined: QueryOperator.IsNotNull,
    isUndefined: QueryOperator.IsNull,
  },
}

function tableOperatorToQuery(dataType: DataType, operator: HightideFilterOperator): QueryOperator | null {
  return TABLE_OPERATOR_TO_QUERY[dataType][operator] ?? null
}

function formatLocalDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toGraphqlDateInput(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return undefined
    return formatLocalDateOnly(parsed)
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return formatLocalDateOnly(value)
  }
  return undefined
}

function localCalendarDateToIso(dateYmd: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd)
  if (!match?.[1] || !match[2] || !match[3]) return undefined
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const dt = new Date(y, m - 1, d)
  if (Number.isNaN(dt.getTime())) return undefined
  return dt.toISOString()
}

function filterDateValueForDataType(value: FilterValue): string | undefined {
  const parameter = value.parameter
  if (value.dataType === 'dateTime') {
    if (parameter.dateValue == null) return undefined
    return parameter.dateValue.toISOString()
  }
  const day = toGraphqlDateInput(parameter.dateValue)
  if (!day) return undefined
  return localCalendarDateToIso(day)
}

function toQueryFilterValue(value: FilterValue): QueryFilterValueInput {
  const parameter = value.parameter
  const raw = parameter as Record<string, unknown>
  const multi = parameter.uuidValues
  const hasMulti = Array.isArray(multi) && multi.length > 0
  const hasSingle = parameter.uuidValue != null && String(parameter.uuidValue) !== ''
  let searchTagsUnknownType: unknown[] = []
  if (hasMulti) {
    searchTagsUnknownType = multi as unknown[]
  } else if (hasSingle) {
    searchTagsUnknownType = [parameter.uuidValue as unknown]
  } else if (Array.isArray(raw['searchTags']) && raw['searchTags'].length > 0) {
    searchTagsUnknownType = raw['searchTags'] as unknown[]
  } else if (Array.isArray(raw['searchTagsContains']) && raw['searchTagsContains'].length > 0) {
    searchTagsUnknownType = raw['searchTagsContains'] as unknown[]
  } else if (raw['searchTag'] != null) {
    searchTagsUnknownType = [raw['searchTag']]
  }
  const searchTags: string[] = searchTagsUnknownType.map((t) => String(t))
  const base: QueryFilterValueInput = {
    stringValue: parameter.stringValue,
    floatValue: parameter.numberValue,
    floatMin: parameter.numberMin,
    floatMax: parameter.numberMax,
    dateValue: filterDateValueForDataType(value),
    dateMin: toGraphqlDateInput(parameter.dateMin),
    dateMax: toGraphqlDateInput(parameter.dateMax),
    stringValues: searchTags.length > 0 ? searchTags : undefined,
  }
  if (value.dataType === 'singleTag' && value.operator === 'equals' && searchTags.length === 1) {
    base.stringValue = searchTags[0]
    base.stringValues = undefined
  }
  if (value.dataType === 'boolean') {
    if (value.operator === 'isTrue') {
      base.boolValue = true
    } else if (value.operator === 'isFalse') {
      base.boolValue = false
    }
  }
  return base
}

export function columnFiltersToQueryFilterClauses(
  filters: ColumnFiltersState
): QueryFilterClauseInput[] {
  const result: QueryFilterClauseInput[] = []
  for (const filter of filters) {
    const value = filter.value as FilterValue
    if (!value?.operator || !value?.parameter || !value?.dataType) continue
    const apiOperator = tableOperatorToQuery(value.dataType, value.operator)
    if (!apiOperator) continue
    const fieldKey = filter.id
    result.push({
      fieldKey,
      operator: apiOperator,
      value: toQueryFilterValue(value),
    })
  }
  return result
}

export function sortingStateToQuerySortClauses(
  sorting: SortingState
): QuerySortClauseInput[] {
  return sorting.map((s) => ({
    fieldKey: s.id,
    direction: s.desc ? SortDirection.Desc : SortDirection.Asc
  }))
}

export function paginationStateToPaginationInput(pagination: PaginationState): { pageIndex: number, pageSize: number } {
  return {
    pageIndex: pagination.pageIndex ?? 0,
    pageSize: pagination.pageSize ?? 10,
  }
}

export { columnFiltersToQueryFilterClauses as columnFiltersToFilterInput }
export { sortingStateToQuerySortClauses as sortingStateToSortInput }
