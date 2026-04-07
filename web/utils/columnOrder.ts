import type { ColumnDef, ColumnOrderState } from '@tanstack/table-core'

export function columnIdsFromColumnDefs<T>(columns: ColumnDef<T>[]): string[] {
  return columns
    .map((col) => {
      if (typeof col.id === 'string' && col.id.length > 0) {
        return col.id
      }
      if ('accessorKey' in col && typeof col.accessorKey === 'string') {
        return col.accessorKey
      }
      return undefined
    })
    .filter((id): id is string => id != null)
}

export function sanitizeColumnOrderForKnownColumns(
  order: ColumnOrderState,
  knownColumnIdsOrdered: readonly string[]
): ColumnOrderState {
  if (knownColumnIdsOrdered.length === 0) {
    return []
  }
  const knownSet = new Set(knownColumnIdsOrdered)
  const kept = order.filter((id) => knownSet.has(id))
  const seen = new Set(kept)
  const appended = knownColumnIdsOrdered.filter((id) => !seen.has(id))
  return [...kept, ...appended]
}
