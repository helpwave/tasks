'use client'

import { Button, Menu, MenuItem } from '@helpwave/hightide'
import { Rabbit } from 'lucide-react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

export type SaveViewActionsMenuProps = {
  canOverwrite: boolean,
  overwriteLoading?: boolean,
  onOverwrite: () => void | Promise<void>,
  onOpenSaveAsNew: () => void,
  onDiscard: () => void,
}

export function SaveViewActionsMenu({
  canOverwrite,
  overwriteLoading = false,
  onOverwrite,
  onOpenSaveAsNew,
  onDiscard,
}: SaveViewActionsMenuProps) {
  const translation = useTasksTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button color="negative" onClick={onDiscard}>
        {translation('discardViewChanges')}
      </Button>
      {canOverwrite ? (
        <Menu
          trigger={({ toggleOpen }, ref) => (
            <Button ref={ref} color="primary" onClick={toggleOpen}>
              <Rabbit className="size-5 shrink-0" />
              {translation('saveView')}
            </Button>
          )}
          className="min-w-56 p-2"
          options={{
            verticalAlignment: 'beforeStart',
          }}
        >
          {({ close }) => (
            <>
              <MenuItem
                onClick={() => {
                  void onOverwrite()
                  close()
                }}
                isDisabled={overwriteLoading}
                className="rounded-md cursor-pointer"
              >
                {translation('saveViewOverwriteCurrent')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onOpenSaveAsNew()
                  close()
                }}
                className="rounded-md cursor-pointer"
              >
                {translation('saveViewAsNew')}
              </MenuItem>
            </>
          )}
        </Menu>
      ) : (
        <Button color="primary" onClick={onOpenSaveAsNew}>
          <Rabbit className="size-5 shrink-0" />
          {translation('saveViewAsNew')}
        </Button>
      )}
    </div>
  )
}
