import type { ColumnDef, ColumnOrderState, VisibilityState } from '@tanstack/table-core'
import type { PatientState, QueryFilterClauseInput, QuerySortClauseInput } from '@/api/gql/generated'
import { getUser } from '@/api/auth/authService'
import { getConfig } from '@/utils/config'
import { columnIdsFromColumnDefs, sanitizeColumnOrderForKnownColumns } from '@/utils/columnOrder'

export type TableExportFormat = 'csv' | 'xlsx'

export type TableExportEntity = 'tasks' | 'patients'

export type TableExportColumn = {
  key: string,
  label: string,
}

export type TableExportScope = {
  rootLocationIds?: string[],
  assigneeId?: string,
  assigneeTeamId?: string,
  patientId?: string,
  locationNodeId?: string,
  states?: PatientState[],
}

export type TableExportRequest = {
  entity: TableExportEntity,
  format: TableExportFormat,
  columns: TableExportColumn[],
  filters?: QueryFilterClauseInput[],
  sorts?: QuerySortClauseInput[],
  search?: { searchText: string, includeProperties: boolean },
  locale: string,
  timezone?: string,
  title?: string,
  scope?: TableExportScope,
}

type ColumnMetaWithLabel = {
  columnLabel?: string,
}

export function collectExportColumns<T>(
  columns: ColumnDef<T>[],
  columnVisibility: VisibilityState,
  columnOrder: ColumnOrderState,
  labelOverrides: Record<string, string> = {}
): TableExportColumn[] {
  const knownIds = columnIdsFromColumnDefs(columns)
  const orderedIds = sanitizeColumnOrderForKnownColumns(columnOrder, knownIds)
  const columnsById = new Map<string, ColumnDef<T>>()
  for (const column of columns) {
    const id = typeof column.id === 'string' && column.id.length > 0
      ? column.id
      : ('accessorKey' in column && typeof column.accessorKey === 'string' ? column.accessorKey : undefined)
    if (id) columnsById.set(id, column)
  }

  const result: TableExportColumn[] = []
  for (const id of orderedIds) {
    if (columnVisibility[id] === false) continue
    const column = columnsById.get(id)
    if (!column) continue
    const meta = column.meta as ColumnMetaWithLabel | undefined
    const label = labelOverrides[id]
      ?? (typeof column.header === 'string' ? column.header : undefined)
      ?? meta?.columnLabel
      ?? id
    result.push({ key: id, label })
  }
  return result
}

export function buildExportEndpoint(entity: TableExportEntity): string {
  const config = getConfig()
  const baseUrl = config.graphqlEndpoint.replace(/\/graphql\/?$/, '')
  return `${baseUrl}/export/${entity}`
}

function filenameFromContentDisposition(header: string | null): string | undefined {
  if (!header) return undefined
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const plainMatch = /filename="?([^";]+)"?/i.exec(header)
  return plainMatch?.[1]
}

export async function downloadTableExport(request: TableExportRequest): Promise<void> {
  const user = await getUser()
  const token = user?.access_token
  const response = await fetch(buildExportEndpoint(request.entity), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      format: request.format,
      columns: request.columns,
      filters: request.filters ?? [],
      sorts: request.sorts ?? [],
      search: request.search ?? null,
      locale: request.locale,
      timezone: request.timezone ?? getConfig().timezone,
      title: request.title ?? null,
      ...request.scope,
    }),
  })

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`)
  }

  const blob = await response.blob()
  const filename = filenameFromContentDisposition(response.headers.get('Content-Disposition'))
    ?? `${request.entity}.${request.format}`

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
