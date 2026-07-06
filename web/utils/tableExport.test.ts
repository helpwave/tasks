import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef } from '@tanstack/table-core'

vi.mock('@/api/auth/authService', () => ({
  getUser: vi.fn(async () => null),
}))

import { buildExportEndpoint, collectExportColumns } from '@/utils/tableExport'

type Row = { id: string }

const columns: ColumnDef<Row>[] = [
  { id: 'done', header: () => null },
  { id: 'title', header: 'Titel' },
  { id: 'dueDate', header: 'Fällig am' },
  {
    id: 'property_abc',
    header: () => null,
    meta: { columnType: 'PROPERTY', columnLabel: 'Allergien' } as ColumnDef<Row>['meta'],
  },
]

describe('collectExportColumns', () => {
  it('keeps definition order and resolves labels from header, override and meta', () => {
    const result = collectExportColumns(columns, {}, [], { done: 'Fertig' })
    expect(result).toEqual([
      { key: 'done', label: 'Fertig' },
      { key: 'title', label: 'Titel' },
      { key: 'dueDate', label: 'Fällig am' },
      { key: 'property_abc', label: 'Allergien' },
    ])
  })

  it('drops hidden columns and applies the user column order', () => {
    const result = collectExportColumns(
      columns,
      { dueDate: false, property_abc: false },
      ['title', 'done'],
      { done: 'Fertig' }
    )
    expect(result).toEqual([
      { key: 'title', label: 'Titel' },
      { key: 'done', label: 'Fertig' },
    ])
  })
})

describe('buildExportEndpoint', () => {
  it('derives the export URL from the graphql endpoint', () => {
    expect(buildExportEndpoint('patients')).toBe('http://localhost:8000/export/patients')
  })
})
