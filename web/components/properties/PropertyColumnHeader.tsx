import { IconButton, Menu, MenuItem } from '@helpwave/hightide'
import { MoreHorizontal } from 'lucide-react'

type PropertyColumnHeaderProps = {
  title: string,
  clearActionLabel: string,
  onClear: () => void,
}

export function PropertyColumnHeader({
  title,
  clearActionLabel,
  onClear,
}: PropertyColumnHeaderProps) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="truncate">{title}</span>
      <Menu
        trigger={({ toggleOpen }, ref) => (
          <div ref={ref} className="shrink-0">
            <IconButton
              color="neutral"
              coloringStyle="text"
              className="min-h-6 min-w-6"
              onClick={(event) => {
                event.stopPropagation()
                toggleOpen()
              }}
            >
              <MoreHorizontal className="size-4" />
            </IconButton>
          </div>
        )}
        className="min-w-48 p-2"
      >
        {({ close }) => (
          <MenuItem
            className="cursor-pointer rounded-md"
            onClick={() => {
              onClear()
              close()
            }}
          >
            {clearActionLabel}
          </MenuItem>
        )}
      </Menu>
    </div>
  )
}
