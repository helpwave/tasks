import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import type { Dispatch, SetStateAction } from 'react'
import { useStateWithLocalStorage } from '@/hooks/useStateWithLocalStorage'

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

export function useTableState(
  storageKeyPrefix: string,
  options: UseTableStateOptions = {}
): UseTableStateResult {
  const {
    defaultSorting: initialSorting = defaultSorting,
    defaultPagination: initialPagination = defaultPagination,
    defaultFilters: initialFilters = defaultFilters,
    defaultColumnVisibility: initialColumnVisibility = defaultColumnVisibility,
  } = options

  const [pagination, setPagination] = useStateWithLocalStorage<PaginationState>({
    key: `${storageKeyPrefix}-column-pagination`,
    defaultValue: initialPagination,
  })
  const [sorting, setSorting] = useStateWithLocalStorage<SortingState>({
    key: `${storageKeyPrefix}-column-sorting`,
    defaultValue: initialSorting,
  })
  const [filters, setFilters] = useStateWithLocalStorage<ColumnFiltersState>({
    key: `${storageKeyPrefix}-column-filters`,
    defaultValue: initialFilters,
  })
  const [columnVisibility, setColumnVisibility] =
    useStateWithLocalStorage<VisibilityState>({
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
