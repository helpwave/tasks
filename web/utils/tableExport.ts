import { getConfig } from '@/utils/config'
import { getUser } from '@/api/auth/authService'

export type TableExportPayload = {
  title: string,
  subtitle?: string,
  columns: string[],
  rows: string[][],
  orientation?: 'portrait' | 'landscape',
  meta?: Record<string, string>,
  rowsLabel?: string,
  emptyLabel?: string,
  generatedLabel?: string,
  pageLabel?: string,
}

function exportEndpoint(): string {
  const { graphqlEndpoint } = getConfig()
  return graphqlEndpoint.replace(/\/graphql\/?$/, '') + '/export/table.pdf'
}

export function cellToText(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) return value.map(cellToText).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value)
}

export async function downloadTablePdf(payload: TableExportPayload): Promise<void> {
  const user = await getUser()
  const token = user?.access_token
  const response = await fetch(exportEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      title: payload.title,
      subtitle: payload.subtitle,
      columns: payload.columns,
      rows: payload.rows,
      orientation: payload.orientation ?? 'landscape',
      meta: payload.meta ?? {},
      ...(payload.rowsLabel ? { rows_label: payload.rowsLabel } : {}),
      ...(payload.emptyLabel ? { empty_label: payload.emptyLabel } : {}),
      ...(payload.generatedLabel ? { generated_label: payload.generatedLabel } : {}),
      ...(payload.pageLabel ? { page_label: payload.pageLabel } : {}),
    }),
  })
  if (!response.ok) {
    throw new Error(`PDF export failed with status ${response.status}`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank')
  if (!opened) {
    const link = document.createElement('a')
    link.href = url
    link.download = `${payload.title || 'table-export'}.pdf`
    link.click()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
