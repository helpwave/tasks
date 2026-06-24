export function columnsForWidth(
  containerWidth: number,
  minCardWidthPx: number,
  gapPx: number
): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 1
  if (!Number.isFinite(minCardWidthPx) || minCardWidthPx <= 0) return 1
  const columns = Math.floor((containerWidth + gapPx) / (minCardWidthPx + gapPx))
  return Math.max(1, columns)
}

export function chunkIntoRows<T>(items: readonly T[], columns: number): T[][] {
  const safeColumns = Math.max(1, Math.floor(columns) || 1)
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += safeColumns) {
    rows.push(items.slice(i, i + safeColumns))
  }
  return rows
}
