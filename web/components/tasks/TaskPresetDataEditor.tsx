import { useMemo } from 'react'
import {
  Button,
  Chip,
  IconButton,
  Input,
  Select,
  SelectOption
} from '@helpwave/hightide'
import { Pencil, PlusIcon, Save, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { TaskPresetScope } from '@/api/gql/generated'
import {
  defaultTaskPresetListRow,
  hasEmptyTaskPresetRowTitle,
  listRowsToTaskGraphInput,
  type TaskPresetListRow
} from '@/utils/taskGraph'
import { PriorityUtils } from '@/utils/priority'

type TaskPresetDataEditorProps = {
  name: string,
  onNameChange: (name: string) => void,
  rows: TaskPresetListRow[],
  onRowsChange: (rows: TaskPresetListRow[]) => void,
  onEditRow: (index: number) => void,
  onSave: () => void,
  onCancel: () => void,
  saving?: boolean,
  scope?: TaskPresetScope,
  onScopeChange?: (scope: TaskPresetScope) => void,
}

export function TaskPresetDataEditor({
  name,
  onNameChange,
  rows,
  onRowsChange,
  onEditRow,
  onSave,
  onCancel,
  saving = false,
  scope,
  onScopeChange,
}: TaskPresetDataEditorProps) {
  const translation = useTasksTranslation()
  const showScope = scope != null && onScopeChange != null

  const canSave = useMemo(
    () =>
      name.trim().length > 0
      && listRowsToTaskGraphInput(rows).nodes.length > 0
      && !hasEmptyTaskPresetRowTitle(rows),
    [name, rows]
  )

  const updateRowTitle = (index: number, title: string) => {
    const next = [...rows]
    const cur = next[index] ?? defaultTaskPresetListRow()
    next[index] = { ...cur, title }
    onRowsChange(next)
  }

  const removeRow = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onRowsChange([...rows, defaultTaskPresetListRow()])
  }

  return (
    <div className="flex flex-col gap-8 pb-6 overflow-y-auto max-h-[min(85dvh,calc(100dvh-5rem))] px-1">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="typography-label-lg">{translation('taskPresetName')}</span>
          <Input value={name} onChange={e => onNameChange(e.target.value)} className="w-full" />
        </div>
        {showScope && (
          <div className="flex flex-col gap-3">
            <span className="typography-label-lg">{translation('taskPresetScope')}</span>
            <Select
              value={scope}
              onValueChange={v => onScopeChange(v as TaskPresetScope)}
              buttonProps={{ className: 'w-full' }}
            >
              <SelectOption
                value={TaskPresetScope.Personal}
                label={translation('taskPresetScopePersonal')}
              >
                {translation('taskPresetScopePersonal')}
              </SelectOption>
              <SelectOption
                value={TaskPresetScope.Global}
                label={translation('taskPresetScopeGlobal')}
              >
                {translation('taskPresetScopeGlobal')}
              </SelectOption>
            </Select>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5 mt-2 pt-2 border-t border-divider">
        <span className="typography-label-lg">{translation('addTask')}</span>
        {rows.map((row, index) => (
          <div
            key={index}
            className={clsx(
              'flex flex-col gap-4 p-5 md:p-6 rounded-xl border bg-background',
              row.title.trim() === '' ? 'border-negative bg-negative/10' : 'border-border'
            )}
          >
            <div className="flex flex-col xl:flex-row xl:items-start gap-5 xl:gap-10 justify-between">
              <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
                <Input
                  placeholder={translation('taskTitlePlaceholder')}
                  value={row.title}
                  onChange={e => updateRowTitle(index, e.target.value)}
                  className="w-full"
                />
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <Chip color="neutral" className="inline-flex items-center gap-3">
                    <span>
                      {translation('priority')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={clsx(
                          'size-2.5 rounded-full shrink-0 bg-neutral-400',
                          PriorityUtils.toBackgroundColor(row.priority)
                        )}
                      />
                      <span className="text-description">
                        {row.priority
                          ? translation('sPriority', { priority: row.priority })
                          : translation('priorityNone')}
                      </span>
                    </span>
                  </Chip>
                  <Chip color="neutral" className="inline-flex items-center gap-3">
                    <span>
                      {translation('timeEstimate')}
                    </span>
                    <span className="text-description">
                      {row.estimatedTime != null && row.estimatedTime > 0
                        ? translation('nMinutesShort', { minCount: row.estimatedTime })
                        : translation('priorityNone')}
                    </span>
                  </Chip>
                </div>
                {row.description.trim() !== '' && (
                  <p className="text-sm text-description leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {row.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-0.5 shrink-0">
                <IconButton
                  type="button"
                  tooltip={translation('taskPresetEditDetails')}
                  coloringStyle="text"
                  color="neutral"
                  className="shrink-0"
                  onClick={() => onEditRow(index)}
                >
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  type="button"
                  tooltip={translation('taskPresetRemoveRow')}
                  coloringStyle="text"
                  color="negative"
                  className="shrink-0"
                  onClick={() => removeRow(index)}
                  disabled={rows.length <= 1}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          color="neutral"
          coloringStyle="outline"
          className="w-fit"
          onClick={addRow}
        >
          <PlusIcon className="size-4" />
          {translation('taskPresetAddRow')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-divider sticky bottom-0 bg-surface-1 -mx-1 px-1 pb-1">
        <Button
          color="neutral"
          coloringStyle="outline"
          className="gap-2"
          onClick={onCancel}
        >
          <X className="size-4 shrink-0" />
          {translation('cancel')}
        </Button>
        <Button
          color="primary"
          className="gap-2"
          onClick={onSave}
          disabled={saving || !canSave}
        >
          <Save className="size-4 shrink-0" />
          {translation('taskPresetSave')}
        </Button>
      </div>
    </div>
  )
}
