import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from '@tanstack/react-table'

type EntityType = 'patient' | 'task'

const columnNameMap: Record<EntityType, Record<string, string>> = {
  patient: {
    name: 'name',
    firstname: 'firstname',
    lastname: 'lastname',
    state: 'state',
    sex: 'sex',
    birthdate: 'birthdate',
    position: 'position_id',
    updated: 'update_date',
  },
  task: {
    title: 'title',
    description: 'description',
    done: 'done',
    dueDate: 'due_date',
    priority: 'priority',
    estimatedTime: 'estimated_time',
    creationDate: 'creation_date',
    updateDate: 'update_date',
    assignee: 'assignee_id',
    assigneeTeam: 'assignee_team_id',
    patient: 'patient_id',
  },
}

export function mapColumnIdToBackendName(columnId: string, entityType: EntityType): string {
  const entityMap = columnNameMap[entityType]
  if (entityMap && entityMap[columnId]) {
    return entityMap[columnId]
  }

  return columnId
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

type FilterValue = {
  operator?: string
  parameter?: {
    searchText?: string
    isCaseSensitive?: boolean
    compareValue?: number
    min?: number
    max?: number
    compareDate?: string | Date
    minDate?: string | Date
    maxDate?: string | Date
    compareDateTime?: string | Date
    minDateTime?: string | Date
    maxDateTime?: string | Date
    searchTags?: string[]
  }
}

const operatorMap: Record<string, string> = {
  textContains: 'TEXT_CONTAINS',
  textEquals: 'TEXT_EQUALS',
  textNotEquals: 'TEXT_NOT_EQUALS',
  textStartsWith: 'TEXT_STARTS_WITH',
  textEndsWith: 'TEXT_ENDS_WITH',
  textNotContains: 'TEXT_NOT_CONTAINS',
  numberEquals: 'NUMBER_EQUALS',
  numberNotEquals: 'NUMBER_NOT_EQUALS',
  numberGreaterThan: 'NUMBER_GREATER_THAN',
  numberGreaterThanOrEqual: 'NUMBER_GREATER_THAN_OR_EQUAL',
  numberLessThan: 'NUMBER_LESS_THAN',
  numberLessThanOrEqual: 'NUMBER_LESS_THAN_OR_EQUAL',
  numberBetween: 'NUMBER_BETWEEN',
  numberNotBetween: 'NUMBER_NOT_BETWEEN',
  dateEquals: 'DATE_EQUALS',
  dateNotEquals: 'DATE_NOT_EQUALS',
  dateGreaterThan: 'DATE_GREATER_THAN',
  dateGreaterThanOrEqual: 'DATE_GREATER_THAN_OR_EQUAL',
  dateLessThan: 'DATE_LESS_THAN',
  dateLessThanOrEqual: 'DATE_LESS_THAN_OR_EQUAL',
  dateBetween: 'DATE_BETWEEN',
  dateNotBetween: 'DATE_NOT_BETWEEN',
  datetimeEquals: 'DATETIME_EQUALS',
  datetimeNotEquals: 'DATETIME_NOT_EQUALS',
  datetimeGreaterThan: 'DATETIME_GREATER_THAN',
  datetimeGreaterThanOrEqual: 'DATETIME_GREATER_THAN_OR_EQUAL',
  datetimeLessThan: 'DATETIME_LESS_THAN',
  datetimeLessThanOrEqual: 'DATETIME_LESS_THAN_OR_EQUAL',
  datetimeBetween: 'DATETIME_BETWEEN',
  datetimeNotBetween: 'DATETIME_NOT_BETWEEN',
  booleanIsTrue: 'BOOLEAN_IS_TRUE',
  booleanIsFalse: 'BOOLEAN_IS_FALSE',
  tagsContains: 'TAGS_CONTAINS',
  tagsEquals: 'TAGS_EQUALS',
  tagsNotContains: 'TAGS_NOT_CONTAINS',
  tagsNotEquals: 'TAGS_NOT_EQUALS',
  tagsSingleContains: 'TAGS_SINGLE_CONTAINS',
  tagsSingleEquals: 'TAGS_SINGLE_EQUALS',
  tagsSingleNotContains: 'TAGS_SINGLE_NOT_CONTAINS',
  tagsSingleNotEquals: 'TAGS_SINGLE_NOT_EQUALS',
  isNull: 'IS_NULL',
  isNotNull: 'IS_NOT_NULL',
}

export function mapColumnFiltersToGraphQL<T>(
  columnFilters: ColumnFiltersState,
  columns: ColumnDef<T>[],
  entityType: EntityType
): Array<{
  column: string
  operator: string
  parameter: {
    search_text?: string | null
    is_case_sensitive?: boolean
    compare_value?: number | null
    min?: number | null
    max?: number | null
    compare_date?: string | null
    min_date?: string | null
    max_date?: string | null
    compare_date_time?: string | null
    min_date_time?: string | null
    max_date_time?: string | null
    search_tags?: string[] | null
  }
  column_type: 'DIRECT_ATTRIBUTE' | 'PROPERTY'
  property_definition_id?: string | null
}> {
  const filters: Array<{
    column: string
    operator: string
    parameter: any
    column_type: 'DIRECT_ATTRIBUTE' | 'PROPERTY'
    property_definition_id?: string | null
  }> = []

  for (const filter of columnFilters) {
    const column = columns.find((col) => col.id === filter.id)
    if (!column) continue

    const filterFn = column.filterFn
    if (!filterFn) continue

    const filterValue = filter.value as FilterValue | string | number | boolean | string[] | undefined

    let operator = 'TEXT_CONTAINS'
    let parameter: any = {}

    if (typeof filterValue === 'object' && filterValue !== null && 'operator' in filterValue) {
      const value = filterValue as FilterValue
      operator = operatorMap[value.operator || 'textContains'] || 'TEXT_CONTAINS'

      if (value.parameter) {
        const param = value.parameter
        if (param.searchText !== undefined) {
          parameter.search_text = param.searchText
        }
        if (param.isCaseSensitive !== undefined) {
          parameter.is_case_sensitive = param.isCaseSensitive
        }
        if (param.compareValue !== undefined) {
          parameter.compare_value = param.compareValue
        }
        if (param.min !== undefined) {
          parameter.min = param.min
        }
        if (param.max !== undefined) {
          parameter.max = param.max
        }
        if (param.compareDate !== undefined) {
          parameter.compare_date = typeof param.compareDate === 'string' ? param.compareDate : param.compareDate.toISOString().split('T')[0]
        }
        if (param.minDate !== undefined) {
          parameter.min_date = typeof param.minDate === 'string' ? param.minDate : param.minDate.toISOString().split('T')[0]
        }
        if (param.maxDate !== undefined) {
          parameter.max_date = typeof param.maxDate === 'string' ? param.maxDate : param.maxDate.toISOString().split('T')[0]
        }
        if (param.compareDateTime !== undefined) {
          parameter.compare_date_time = typeof param.compareDateTime === 'string' ? param.compareDateTime : param.compareDateTime.toISOString()
        }
        if (param.minDateTime !== undefined) {
          parameter.min_date_time = typeof param.minDateTime === 'string' ? param.minDateTime : param.minDateTime.toISOString()
        }
        if (param.maxDateTime !== undefined) {
          parameter.max_date_time = typeof param.maxDateTime === 'string' ? param.maxDateTime : param.maxDateTime.toISOString()
        }
        if (param.searchTags !== undefined) {
          parameter.search_tags = param.searchTags
        }
      }
    } else {
      if (filterFn === 'text') {
        operator = 'TEXT_CONTAINS'
        parameter.search_text = String(filterValue || '')
      } else if (filterFn === 'number') {
        operator = 'NUMBER_EQUALS'
        parameter.compare_value = typeof filterValue === 'number' ? filterValue : parseFloat(String(filterValue || 0))
      } else if (filterFn === 'date') {
        operator = 'DATE_EQUALS'
        if (filterValue instanceof Date) {
          parameter.compare_date = filterValue.toISOString().split('T')[0]
        } else if (typeof filterValue === 'string') {
          parameter.compare_date = filterValue
        }
      } else if (filterFn === 'boolean') {
        operator = filterValue === true ? 'BOOLEAN_IS_TRUE' : 'BOOLEAN_IS_FALSE'
      } else if (filterFn === 'tags' || filterFn === 'arrIncludes') {
        operator = 'TAGS_CONTAINS'
        parameter.search_tags = Array.isArray(filterValue) ? filterValue : filterValue ? [String(filterValue)] : []
      }
    }

    const columnName = mapColumnIdToBackendName(filter.id, entityType)
    const propertyDefinitionId = (column.meta as any)?.filterData?.propertyDefinitionId

    filters.push({
      column: columnName,
      operator,
      parameter,
      column_type: propertyDefinitionId ? 'PROPERTY' : 'DIRECT_ATTRIBUTE',
      property_definition_id: propertyDefinitionId || null,
    })
  }

  return filters
}

export function mapSortingToGraphQL(
  sorting: SortingState,
  entityType: EntityType
): Array<{
  column: string
  direction: 'ASC' | 'DESC'
  column_type: 'DIRECT_ATTRIBUTE' | 'PROPERTY'
  property_definition_id?: string | null
}> {
  return sorting.map((sort) => {
    const columnName = mapColumnIdToBackendName(sort.id, entityType)
    return {
      column: columnName,
      direction: sort.desc ? 'DESC' : 'ASC',
      column_type: 'DIRECT_ATTRIBUTE' as const,
      property_definition_id: null,
    }
  })
}

export function mapPaginationToGraphQL(pagination: PaginationState): {
  pageIndex: number
  pageSize: number | null
} {
  return {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize || null,
  }
}

export function mapSearchToGraphQL(
  searchText: string,
  searchColumns?: string[]
): {
  search_text: string
  search_columns: string[] | null
  include_properties: boolean
  property_definition_ids: string[] | null
} | null {
  if (!searchText.trim()) {
    return null
  }

  return {
    search_text: searchText,
    search_columns: searchColumns || null,
    include_properties: false,
    property_definition_ids: null,
  }
}
