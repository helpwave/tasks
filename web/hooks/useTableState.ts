import type {
  ColumnFiltersState,
  ColumnOrderState,
  PaginationState,
  SortingState,
  VisibilityState
} from '@tanstack/react-table'
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

const defaultPagination: PaginationState = {
  pageSize: 10,
  pageIndex: 0,
}

const defaultSorting: SortingState = []
const defaultFilters: ColumnFiltersState = []
const defaultColumnVisibility: VisibilityState = {}
const defaultColumnOrder: ColumnOrderState = []

export type UseTableStateOptions = {
  defaultSorting?: SortingState,
  defaultPagination?: PaginationState,
  defaultFilters?: ColumnFiltersState,
  defaultColumnVisibility?: VisibilityState,
  defaultColumnOrder?: ColumnOrderState,
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
  columnOrder: ColumnOrderState,
  setColumnOrder: Dispatch<SetStateAction<ColumnOrderState>>,
}

export function useTableState(options: UseTableStateOptions = {}): UseTableStateResult {
  const {
    defaultSorting: initialSorting = defaultSorting,
    defaultPagination: initialPagination = defaultPagination,
    defaultFilters: initialFilters = defaultFilters,
    defaultColumnVisibility: initialColumnVisibility = defaultColumnVisibility,
    defaultColumnOrder: initialColumnOrder = defaultColumnOrder,
  } = options

  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [filters, setFilters] = useState<ColumnFiltersState>(initialFilters)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder)

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  }
}

export function useRecentOverviewTableState(
  options: Pick<UseTableStateOptions, 'defaultPagination' | 'defaultColumnVisibility' | 'defaultColumnOrder'> = {}
): UseTableStateResult {
  const {
    defaultPagination: initialPagination = defaultPagination,
    defaultColumnVisibility: initialColumnVisibility = defaultColumnVisibility,
    defaultColumnOrder: initialColumnOrder = defaultColumnOrder,
  } = options

  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder)

  const sorting = useMemo(() => [] as SortingState, [])
  const filters = useMemo(() => [] as ColumnFiltersState, [])
  const setSorting = useCallback((_u: SetStateAction<SortingState>) => undefined, [])
  const setFilters = useCallback((_u: SetStateAction<ColumnFiltersState>) => undefined, [])

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  }
}
