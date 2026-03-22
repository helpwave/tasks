import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import type { FilterInput, FilterOperator, FilterParameter, SortInput } from '@/api/gql/generated'
import { ColumnType, SortDirection } from '@/api/gql/generated'
import type { DataType, FilterValue, FilterOperator as HightideFilterOperator } from '@helpwave/hightide'

const TABLE_OPERATOR_TO_API: Record<DataType, Partial<Record<HightideFilterOperator, FilterOperator>>> = {
  text: {
    equals: 'TEXT_EQUALS' as FilterOperator,
    notEquals: 'TEXT_NOT_EQUALS' as FilterOperator,
    contains: 'TEXT_CONTAINS' as FilterOperator,
    notContains: 'TEXT_NOT_CONTAINS' as FilterOperator,
    startsWith: 'TEXT_STARTS_WITH' as FilterOperator,
    endsWith: 'TEXT_ENDS_WITH' as FilterOperator,
    // TODO consider what to do with TEXT_NOT_WHITESPACE
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  number: {
    equals: 'NUMBER_EQUALS' as FilterOperator,
    notEquals: 'NUMBER_NOT_EQUALS' as FilterOperator,
    greaterThan: 'NUMBER_GREATER_THAN' as FilterOperator,
    greaterThanOrEqual: 'NUMBER_GREATER_THAN_OR_EQUAL' as FilterOperator,
    lessThan: 'NUMBER_LESS_THAN' as FilterOperator,
    lessThanOrEqual: 'NUMBER_LESS_THAN_OR_EQUAL' as FilterOperator,
    between: 'NUMBER_BETWEEN' as FilterOperator,
    notBetween: 'NUMBER_NOT_BETWEEN' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  date: {
    equals: 'DATE_EQUALS' as FilterOperator,
    notEquals: 'DATE_NOT_EQUALS' as FilterOperator,
    greaterThan: 'DATE_GREATER_THAN' as FilterOperator,
    greaterThanOrEqual: 'DATE_GREATER_THAN_OR_EQUAL' as FilterOperator,
    lessThan: 'DATE_LESS_THAN' as FilterOperator,
    lessThanOrEqual: 'DATE_LESS_THAN_OR_EQUAL' as FilterOperator,
    between: 'DATE_BETWEEN' as FilterOperator,
    notBetween: 'DATE_NOT_BETWEEN' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  dateTime: {
    equals: 'DATETIME_EQUALS' as FilterOperator,
    notEquals: 'DATETIME_NOT_EQUALS' as FilterOperator,
    greaterThan: 'DATETIME_GREATER_THAN' as FilterOperator,
    greaterThanOrEqual: 'DATETIME_GREATER_THAN_OR_EQUAL' as FilterOperator,
    lessThan: 'DATETIME_LESS_THAN' as FilterOperator,
    lessThanOrEqual: 'DATETIME_LESS_THAN_OR_EQUAL' as FilterOperator,
    between: 'DATETIME_BETWEEN' as FilterOperator,
    notBetween: 'DATETIME_NOT_BETWEEN' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  boolean: {
    isTrue: 'BOOLEAN_IS_TRUE' as FilterOperator,
    isFalse: 'BOOLEAN_IS_FALSE' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  singleTag: {
    equals: 'TAGS_SINGLE_EQUALS' as FilterOperator,
    notEquals: 'TAGS_SINGLE_NOT_EQUALS' as FilterOperator,
    contains: 'TAGS_SINGLE_CONTAINS' as FilterOperator,
    notContains: 'TAGS_SINGLE_NOT_CONTAINS' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  multiTags: {
    equals: 'TAGS_EQUALS' as FilterOperator,
    notEquals: 'TAGS_NOT_EQUALS' as FilterOperator,
    contains: 'TAGS_CONTAINS' as FilterOperator,
    notContains: 'TAGS_NOT_CONTAINS' as FilterOperator,
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
  unknownType: {
    isNotUndefined: 'IS_NOT_NULL' as FilterOperator,
    isUndefined: 'IS_NULL' as FilterOperator,
  },
}

function tableOperatorToApi(dataType: DataType, operator: HightideFilterOperator): FilterOperator | null {
  return TABLE_OPERATOR_TO_API[dataType][operator] ?? null
}

function toFilterParameter(value: FilterValue, propertyDefinitionId?: string): FilterParameter {
  const parameter = value.parameter
  const raw = parameter as Record<string, unknown>
  const multi = parameter.multiOptionSearch
  const hasMulti = Array.isArray(multi) && multi.length > 0
  const hasSingle = parameter.singleOptionSearch != null && parameter.singleOptionSearch !== ''
  let searchTagsUnknownType: unknown[] = []
  if (hasMulti) {
    searchTagsUnknownType = multi as unknown[]
  } else if (hasSingle) {
    searchTagsUnknownType = [parameter.singleOptionSearch as unknown]
  } else if (Array.isArray(raw['searchTags']) && raw['searchTags'].length > 0) {
    searchTagsUnknownType = raw['searchTags'] as unknown[]
  } else if (Array.isArray(raw['searchTagsContains']) && raw['searchTagsContains'].length > 0) {
    searchTagsUnknownType = raw['searchTagsContains'] as unknown[]
  } else if (raw['searchTag'] != null) {
    searchTagsUnknownType = [raw['searchTag']]
  }
  const searchTags: string[] = searchTagsUnknownType.map((t) => String(t))
  const param: FilterParameter = {
    searchText: parameter.searchText,
    isCaseSensitive: parameter.isCaseSensitive,
    compareValue: parameter.compareValue,
    min: parameter.minNumber,
    max: parameter.maxNumber,
    compareDate: parameter.compareDate?.toISOString().split('T')[0],
    minDate: parameter.minDate?.toISOString().split('T')[0],
    maxDate: parameter.maxDate?.toISOString().split('T')[0],
    compareDateTime: parameter.compareDate?.toISOString().split('Z')[0],
    minDateTime: parameter.minDate?.toISOString().split('Z')[0],
    maxDateTime: parameter.maxDate?.toISOString().split('Z')[0],
    searchTags,
    propertyDefinitionId: propertyDefinitionId,
  }
  return param
}

const TASK_COLUMN_TO_BACKEND: Record<string, string> = {
  dueDate: 'due_date',
  updateDate: 'update_date',
  creationDate: 'creation_date',
  estimatedTime: 'estimated_time',
  assigneeTeam: 'assignee_team_id',
}

function isPropertyColumnId(id: string): boolean {
  return id.startsWith('property_')
}

function getPropertyDefinitionId(id: string): string | undefined {
  if (!isPropertyColumnId(id)) return undefined
  return id.replace(/^property_/, '')
}

function columnIdToBackend(columnId: string, entity: 'task' | 'patient'): string {
  if (entity === 'task' && TASK_COLUMN_TO_BACKEND[columnId]) {
    return TASK_COLUMN_TO_BACKEND[columnId]
  }
  return columnId
}

export function columnFiltersToFilterInput(
  filters: ColumnFiltersState,
  entity: 'task' | 'patient' = 'patient'
): FilterInput[] {
  const result: FilterInput[] = []
  for (const filter of filters) {
    const value = filter.value as FilterValue
    if (!value?.operator || !value?.parameter || !value?.dataType) continue
    const apiOperator = tableOperatorToApi(value.dataType, value.operator)
    if (!apiOperator) continue
    const isProperty = isPropertyColumnId(filter.id)
    const propertyDefinitionId = getPropertyDefinitionId(filter.id)
    const column = columnIdToBackend(filter.id, entity)
    result.push({
      column,
      operator: apiOperator,
      parameter: toFilterParameter(value),
      columnType: isProperty ? ColumnType.Property : ColumnType.DirectAttribute,
      propertyDefinitionId: propertyDefinitionId ?? undefined,
    })
  }
  return result
}

export function sortingStateToSortInput(
  sorting: SortingState,
  entity: 'task' | 'patient' = 'patient'
): SortInput[] {
  return sorting.map((s) => ({
    column: columnIdToBackend(s.id, entity),
    direction: s.desc ? SortDirection.Desc : SortDirection.Asc,
    columnType: isPropertyColumnId(s.id) ? ColumnType.Property : ColumnType.DirectAttribute,
    propertyDefinitionId: getPropertyDefinitionId(s.id) ?? undefined,
  }))
}

export function paginationStateToPaginationInput(pagination: PaginationState): { pageIndex: number, pageSize: number } {
  return {
    pageIndex: pagination.pageIndex ?? 0,
    pageSize: pagination.pageSize ?? 10,
  }
}
