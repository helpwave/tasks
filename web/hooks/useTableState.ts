import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import type { DateFilterParameter, DatetimeFilterParameter, TableFilterValue } from '@helpwave/hightide'
import { useStorage } from '@helpwave/hightide'

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
        const tableFilterValue = filter.value as TableFilterValue
        let parameter: Record<string, unknown> = tableFilterValue.parameter
        if(tableFilterValue.operator.startsWith('dateTime')) {
          const dateTimeParameter: DatetimeFilterParameter = parameter as DatetimeFilterParameter
          parameter = {
            ...parameter,
            compareDatetime: dateTimeParameter.compareDatetime ? dateTimeParameter.compareDatetime.toISOString() : undefined,
            min: dateTimeParameter.min ? dateTimeParameter.min.toISOString() : undefined,
            max: dateTimeParameter.max ? dateTimeParameter.max.toISOString() : undefined,
          }
        } else if(tableFilterValue.operator.startsWith('date')) {
          const dateParameter: DateFilterParameter = parameter as DateFilterParameter
          parameter = {
            ...parameter,
            compareDate: dateParameter.compareDate ? dateParameter.compareDate.toISOString() : undefined,
            min: dateParameter.min ? dateParameter.min.toISOString() : undefined,
            max: dateParameter.max ? dateParameter.max.toISOString() : undefined,
          }
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
      return mappedColumnFilter.map((filter) => {
        const filterValue = filter['value'] as Record<string, unknown>
        const operator: string = filterValue['operator'] as string
        let parameter: Record<string, unknown> = filterValue['parameter'] as Record<string, unknown>
        if(operator.startsWith('dateTime')) {
          parameter = {
            ...parameter,
            compareDatetime: parameter['compareDatetime'] ? new Date(parameter['compareDatetime'] as string) : undefined,
            min: parameter['min'] ? new Date(parameter['min'] as string) : undefined,
            max: parameter['max'] ? new Date(parameter['max'] as string) : undefined,
          }
        }
        else if(operator.startsWith('date')) {
          parameter = {
            ...parameter,
            compareDate: parameter['compareDate'] ? new Date(parameter['compareDate'] as string) : undefined,
            min: parameter['min'] ? new Date(parameter['min'] as string) : undefined,
            max: parameter['max'] ? new Date(parameter['max'] as string) : undefined,
          }
        }
        return {
          ...filter,
          value: {
            ...filterValue,
            parameter,
          },
        }
      }) as unknown as ColumnFiltersState
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
