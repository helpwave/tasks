import type {
  ColumnFilter,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import type { DataType, FilterOperator, FilterParameter, FilterValue } from '@helpwave/hightide'
import { useStorage } from '@/hooks/useStorage'

const defaultPagination: PaginationState = {
  pageSize: 10,
  pageIndex: 0,
}

const defaultSorting: SortingState = []
const defaultFilters: ColumnFiltersState = []
const defaultColumnVisibility: VisibilityState = {}

export type UseTableStateOptions = {
  defaultSorting?: SortingState,
  defaultPagination?: PaginationState,
  defaultFilters?: ColumnFiltersState,
  defaultColumnVisibility?: VisibilityState,
}

export type UseTableStateResult = {
  pagination: PaginationState,
  setPagination: Dispatch<SetStateAction<PaginationState>>,
  sorting: SortingState,
  setSorting: Dispatch<SetStateAction<SortingState>>,
  filters: ColumnFiltersState,
  setFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
  columnVisibility: VisibilityState,
  setColumnVisibility: Dispatch<SetStateAction<VisibilityState>>,
}

export function useStorageSyncedTableState(
  storageKeyPrefix: string,
  options: UseTableStateOptions = {}
): UseTableStateResult {
  const {
    defaultSorting: initialSorting = defaultSorting,
    defaultPagination: initialPagination = defaultPagination,
    defaultFilters: initialFilters = defaultFilters,
    defaultColumnVisibility: initialColumnVisibility = defaultColumnVisibility,
  } = options

  const { value: pagination, setValue: setPagination } = useStorage<PaginationState>({
    key: `${storageKeyPrefix}-column-pagination`,
    defaultValue: initialPagination,
  })
  const { value: sorting, setValue: setSorting } = useStorage<SortingState>({
    key: `${storageKeyPrefix}-column-sorting`,
    defaultValue: initialSorting,
  })
  const { value: filters, setValue: setFilters } = useStorage<ColumnFiltersState>({
    key: `${storageKeyPrefix}-column-filters`,
    defaultValue: initialFilters,
    serialize: (value) => {
      const mappedColumnFilter = value.map((filter) => {
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
    },
    deserialize: (value) => {
      const mappedColumnFilter = JSON.parse(value) as Record<string, unknown>[]
      return mappedColumnFilter.map((filter): ColumnFilter => {
        const value = filter['value'] as Record<string, unknown>
        const parameter: Record<string, unknown> = value['parameter'] as Record<string, unknown>
        const filterParameter: FilterParameter = {
          ...parameter,
          compareDate: parameter['compareDate'] ? new Date(parameter['compareDate'] as string) : undefined,
          minDate: parameter['minDate'] ? new Date(parameter['minDate'] as string) : undefined,
          maxDate: parameter['maxDate'] ? new Date(parameter['maxDate'] as string) : undefined,
        }
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
    },
  })
  const { value: columnVisibility, setValue: setColumnVisibility } = useStorage<VisibilityState>({
    key: `${storageKeyPrefix}-column-visibility`,
    defaultValue: initialColumnVisibility,
  })

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
  }
}
