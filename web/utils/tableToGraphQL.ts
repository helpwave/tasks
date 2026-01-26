import type { ColumnDef, TableState } from '@tanstack/table-core'
import type {
  FilterInput,
  SortInput,
  PaginationInput,
  FullTextSearchInput,
  FilterParameter
} from '@/api/gql/generated'
import { ColumnType, SortDirection, FilterOperator } from '@/api/gql/generated'

export function mapTableStateToGraphQL<TData>(
  tableState: TableState | undefined,
  columns: ColumnDef<TData>[],
  searchText: string | undefined
): {
  filtering: FilterInput[] | undefined,
  sorting: SortInput[] | undefined,
  pagination: PaginationInput | undefined,
  search: FullTextSearchInput | undefined,
} {
  const filtering: FilterInput[] = []
  const sorting: SortInput[] = []

  if (tableState?.columnFilters) {
    for (const filter of tableState.columnFilters) {
      const column = columns.find(col => col.id === filter.id)
      if (!column) continue

      const meta = column.meta as {
        columnType?: ColumnType,
        propertyDefinitionId?: string,
        fieldType?: string,
      } | undefined
      const columnType = meta?.columnType ?? ColumnType.DirectAttribute

      if (columnType === ColumnType.Property && !meta?.propertyDefinitionId) {
        continue
      }

      const filterValue = filter.value
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        continue
      }

      let operator: FilterOperator
      let parameter: FilterParameter

      if (Array.isArray(filterValue)) {
        if (
          columnType === ColumnType.Property &&
          meta?.fieldType === 'FIELD_TYPE_MULTI_SELECT'
        ) {
          operator = FilterOperator.TagsContains
        } else {
          operator = FilterOperator.TagsSingleContains
        }
        parameter = {
          searchTags: filterValue,
        }
      } else if (typeof filterValue === 'boolean') {
        operator = filterValue
          ? FilterOperator.BooleanIsTrue
          : FilterOperator.BooleanIsFalse
        parameter = {}
      } else if (typeof filterValue === 'string') {
        operator = FilterOperator.TextContains
        parameter = {
          searchText: filterValue,
          isCaseSensitive: false,
        }
      } else {
        continue
      }

      filtering.push({
        column: filter.id,
        operator,
        parameter,
        columnType: columnType,
        propertyDefinitionId: columnType === ColumnType.Property ? meta?.propertyDefinitionId : undefined,
      })
    }
  }

  if (tableState?.sorting) {
    for (const sort of tableState.sorting) {
      const column = columns.find(col => col.id === sort.id)
      if (!column) continue

      const meta = column.meta as {
        columnType?: ColumnType,
        propertyDefinitionId?: string,
      } | undefined
      const columnType = meta?.columnType ?? ColumnType.DirectAttribute

      if (columnType === ColumnType.Property && !meta?.propertyDefinitionId) {
        continue
      }

      sorting.push({
        column: sort.id,
        direction: sort.desc ? SortDirection.Desc : SortDirection.Asc,
        columnType: columnType,
        propertyDefinitionId:
          columnType === ColumnType.Property
            ? meta?.propertyDefinitionId
            : undefined,
      })
    }
  }

  const pagination: PaginationInput | undefined = tableState?.pagination
    ? {
      pageIndex: tableState.pagination.pageIndex,
      pageSize: tableState.pagination.pageSize ?? undefined,
    }
    : undefined

  const search: FullTextSearchInput | undefined = searchText
    ? {
      searchText: searchText,
      includeProperties: true,
    }
    : undefined

  return {
    filtering: filtering.length > 0 ? filtering : undefined,
    sorting: sorting.length > 0 ? sorting : undefined,
    pagination,
    search,
  }
}
