import { useCallback, useState } from 'react'
import { IconButton, useTableStateContext } from '@helpwave/hightide'
import { Loader2, Printer } from 'lucide-react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { cellToText, downloadTablePdf } from '@/utils/tableExport'

type TableExportButtonProps = {
  title: string,
  subtitle?: string,
  meta?: Record<string, string>,
  /** Column ids to omit from the export (e.g. selection/action columns). */
  excludeColumnIds?: string[],
}

/**
 * Renders a print button that exports the table's currently visible columns and
 * loaded rows to a server-generated PDF. Must be rendered inside a TableProvider.
 */
export function TableExportButton({ title, subtitle, meta, excludeColumnIds }: TableExportButtonProps) {
  const translation = useTasksTranslation()
  const { table } = useTableStateContext()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    const skip = new Set(excludeColumnIds ?? [])
    const exportColumns = table.getVisibleLeafColumns().filter((column) => {
      const header = column.columnDef.header
      return typeof header === 'string' && header.length > 0 && !skip.has(column.id)
    })
    if (exportColumns.length === 0) return
    const columns = exportColumns.map((column) => column.columnDef.header as string)
    const rows = table.getRowModel().rows.map((row) =>
      exportColumns.map((column) => cellToText(row.getValue(column.id)))
    )
    setIsExporting(true)
    try {
      await downloadTablePdf({ title, subtitle, columns, rows, meta })
    } finally {
      setIsExporting(false)
    }
  }, [table, title, subtitle, meta, excludeColumnIds])

  return (
    <IconButton
      tooltip={translation('print')}
      color="neutral"
      className="min-h-11 min-w-11 print:hidden"
      disabled={isExporting}
      onClick={() => void handleExport()}
    >
      {isExporting ? <Loader2 className="size-5 animate-spin" /> : <Printer className="size-5" />}
    </IconButton>
  )
}
