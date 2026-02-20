import type { ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'
import type { FilterInput, FilterOperator, FilterParameter, SortInput } from '@/api/gql/generated'
import { ColumnType, SortDirection } from '@/api/gql/generated'
import type { TableFilterValue } from '@helpwave/hightide'

const TABLE_OPERATOR_TO_API: Record<string, FilterOperator> = {
  textEquals: 'TEXT_EQUALS' as FilterOperator,
  textNotEquals: 'TEXT_NOT_EQUALS' as FilterOperator,
  textContains: 'TEXT_CONTAINS' as FilterOperator,
  textNotContains: 'TEXT_NOT_CONTAINS' as FilterOperator,
  textStartsWith: 'TEXT_STARTS_WITH' as FilterOperator,
  textEndsWith: 'TEXT_ENDS_WITH' as FilterOperator,
  textNotWhitespace: 'TEXT_NOT_WHITESPACE' as FilterOperator,
  numberEquals: 'NUMBER_EQUALS' as FilterOperator,
  numberNotEquals: 'NUMBER_NOT_EQUALS' as FilterOperator,
  numberGreaterThan: 'NUMBER_GREATER_THAN' as FilterOperator,
  numberGreaterThanOrEqual: 'NUMBER_GREATER_THAN_OR_EQUAL' as FilterOperator,
  numberLessThan: 'NUMBER_LESS_THAN' as FilterOperator,
  numberLessThanOrEqual: 'NUMBER_LESS_THAN_OR_EQUAL' as FilterOperator,
  numberBetween: 'NUMBER_BETWEEN' as FilterOperator,
  numberNotBetween: 'NUMBER_NOT_BETWEEN' as FilterOperator,
  dateEquals: 'DATE_EQUALS' as FilterOperator,
  dateNotEquals: 'DATE_NOT_EQUALS' as FilterOperator,
  dateGreaterThan: 'DATE_GREATER_THAN' as FilterOperator,
  dateGreaterThanOrEqual: 'DATE_GREATER_THAN_OR_EQUAL' as FilterOperator,
  dateLessThan: 'DATE_LESS_THAN' as FilterOperator,
  dateLessThanOrEqual: 'DATE_LESS_THAN_OR_EQUAL' as FilterOperator,
  dateBetween: 'DATE_BETWEEN' as FilterOperator,
  dateNotBetween: 'DATE_NOT_BETWEEN' as FilterOperator,
  dateTimeEquals: 'DATETIME_EQUALS' as FilterOperator,
  dateTimeNotEquals: 'DATETIME_NOT_EQUALS' as FilterOperator,
  dateTimeGreaterThan: 'DATETIME_GREATER_THAN' as FilterOperator,
  dateTimeGreaterThanOrEqual: 'DATETIME_GREATER_THAN_OR_EQUAL' as FilterOperator,
  dateTimeLessThan: 'DATETIME_LESS_THAN' as FilterOperator,
  dateTimeLessThanOrEqual: 'DATETIME_LESS_THAN_OR_EQUAL' as FilterOperator,
  dateTimeBetween: 'DATETIME_BETWEEN' as FilterOperator,
  dateTimeNotBetween: 'DATETIME_NOT_BETWEEN' as FilterOperator,
  booleanIsTrue: 'BOOLEAN_IS_TRUE' as FilterOperator,
  booleanIsFalse: 'BOOLEAN_IS_FALSE' as FilterOperator,
  tagsEquals: 'TAGS_EQUALS' as FilterOperator,
  tagsNotEquals: 'TAGS_NOT_EQUALS' as FilterOperator,
  tagsContains: 'TAGS_CONTAINS' as FilterOperator,
  tagsNotContains: 'TAGS_NOT_CONTAINS' as FilterOperator,
  tagsSingleEquals: 'TAGS_SINGLE_EQUALS' as FilterOperator,
  tagsSingleNotEquals: 'TAGS_SINGLE_NOT_EQUALS' as FilterOperator,
  tagsSingleContains: 'TAGS_SINGLE_CONTAINS' as FilterOperator,
  tagsSingleNotContains: 'TAGS_SINGLE_NOT_CONTAINS' as FilterOperator,
  isNull: 'IS_NULL' as FilterOperator,
  isNotNull: 'IS_NOT_NULL' as FilterOperator,
}

function tableOperatorToApi(operator: string): FilterOperator | null {
  const normalized = operator.replace(/([A-Z])/g, (m) => m.toLowerCase())
  return TABLE_OPERATOR_TO_API[normalized] ?? TABLE_OPERATOR_TO_API[operator] ?? (operator in TABLE_OPERATOR_TO_API ? (operator as FilterOperator) : null)
}

function toFilterParameter(value: TableFilterValue): FilterParameter {
  const p = value.parameter as Record<string, unknown>
  const param: FilterParameter = {
    searchText: typeof p['searchText'] === 'string' ? p['searchText'] : undefined,
    isCaseSensitive: typeof p['isCaseSensitive'] === 'boolean' ? p['isCaseSensitive'] : false,
    compareValue: typeof p['compareValue'] === 'number' ? p['compareValue'] : undefined,
    min: typeof p['min'] === 'number' ? p['min'] : undefined,
    max: typeof p['max'] === 'number' ? p['max'] : undefined,
  }
  if (p['compareDate'] instanceof Date) {
    param.compareDate = (p['compareDate'] as Date).toISOString().slice(0, 10)
  } else if (typeof p['compareDate'] === 'string') {
    param.compareDate = p['compareDate']
  }
  if (p['min'] instanceof Date) param.minDate = (p['min'] as Date).toISOString().slice(0, 10)
  else if (typeof p['min'] === 'string' && (p['min'] as string).length === 10) param.minDate = p['min'] as string
  if (p['max'] instanceof Date) param.maxDate = (p['max'] as Date).toISOString().slice(0, 10)
  else if (typeof p['max'] === 'string' && (p['max'] as string).length === 10) param.maxDate = p['max'] as string
  if (p['compareDatetime'] instanceof Date) {
    param.compareDateTime = (p['compareDatetime'] as Date).toISOString()
  } else if (typeof p['compareDatetime'] === 'string') {
    param.compareDateTime = p['compareDatetime']
  }
  if (p['minDateTime'] instanceof Date) param.minDateTime = (p['minDateTime'] as Date).toISOString()
  else if (typeof p['minDateTime'] === 'string') param.minDateTime = p['minDateTime']
  if (p['maxDateTime'] instanceof Date) param.maxDateTime = (p['maxDateTime'] as Date).toISOString()
  else if (typeof p['maxDateTime'] === 'string') param.maxDateTime = p['maxDateTime']
  if (Array.isArray(p['searchTags'])) {
    param.searchTags = (p['searchTags'] as unknown[]).filter((t): t is string => typeof t === 'string')
  }
  if (typeof p['propertyDefinitionId'] === 'string') {
    param.propertyDefinitionId = p['propertyDefinitionId']
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
    const value = filter.value as TableFilterValue
    if (!value?.operator || !value?.parameter) continue
    const apiOperator = tableOperatorToApi(value.operator)
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
