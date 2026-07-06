'use client'

import { useState } from 'react'
import { IconButton, Menu, MenuItem } from '@helpwave/hightide'
import { FileDown, Loader2 } from 'lucide-react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { TableExportFormat, TableExportRequest } from '@/utils/tableExport'
import { downloadTableExport } from '@/utils/tableExport'

export type TableExportMenuProps = {
  buildRequest: (format: TableExportFormat) => TableExportRequest,
}

export function TableExportMenu({ buildRequest }: TableExportMenuProps) {
  const translation = useTasksTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [hasError, setHasError] = useState(false)

  const startExport = async (format: TableExportFormat) => {
    setIsExporting(true)
    setHasError(false)
    try {
      await downloadTableExport(buildRequest(format))
    } catch (error) {
      console.error('Table export failed', error)
      setHasError(true)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Menu
      trigger={({ toggleOpen }, ref) => (
        <IconButton
          ref={ref}
          tooltip={hasError ? translation('exportFailed') : translation('export')}
          className="min-h-11 min-w-11 shrink-0"
          color={hasError ? 'negative' : 'neutral'}
          onClick={toggleOpen}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="size-5 animate-spin" /> : <FileDown className="size-5" />}
        </IconButton>
      )}
      className="min-w-56 p-2"
    >
      {({ close }) => (
        <>
          <MenuItem
            onClick={() => {
              void startExport('xlsx')
              close()
            }}
            isDisabled={isExporting}
            className="rounded-md cursor-pointer"
          >
            {translation('exportExcel')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              void startExport('csv')
              close()
            }}
            isDisabled={isExporting}
            className="rounded-md cursor-pointer"
          >
            {translation('exportCsv')}
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
