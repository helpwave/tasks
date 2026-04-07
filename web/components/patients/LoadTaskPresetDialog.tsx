import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  FocusTrapWrapper,
  Select,
  SelectOption
} from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useApplyTaskGraph, useTaskPresets } from '@/data'
import type { TaskPresetsQuery } from '@/api/gql/generated'

type PresetRow = TaskPresetsQuery['taskPresets'][number]

type LoadTaskPresetDialogProps = {
  isOpen: boolean,
  onClose: () => void,
  patientId: string,
  onSuccess?: () => void,
}

export function LoadTaskPresetDialog({
  isOpen,
  onClose,
  patientId,
  onSuccess,
}: LoadTaskPresetDialogProps) {
  const translation = useTasksTranslation()
  const { data, loading } = useTaskPresets()
  const [applyTaskGraph, { loading: applying }] = useApplyTaskGraph()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const presets = useMemo(() => data?.taskPresets ?? [], [data?.taskPresets])

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(undefined)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || presets.length === 0) return
    setSelectedId(prev => {
      const first = presets[0]
      if (!first) return prev
      return prev && presets.some(p => p.id === prev) ? prev : first.id
    })
  }, [isOpen, presets])

  const selected: PresetRow | undefined = useMemo(
    () => presets.find(p => p.id === selectedId),
    [presets, selectedId]
  )

  const taskCount = selected?.graph.nodes.length ?? 0

  const handlePrimary = useCallback(() => {
    if (!selectedId || taskCount === 0) return
    setConfirmOpen(true)
  }, [selectedId, taskCount])

  const handleConfirmApply = useCallback(async () => {
    if (!selectedId) return
    await applyTaskGraph({
      variables: {
        data: {
          patientId,
          presetId: selectedId,
          assignToCurrentUser: false,
        },
      },
    })
    setConfirmOpen(false)
    onClose()
    onSuccess?.()
  }, [applyTaskGraph, patientId, selectedId, onClose, onSuccess])

  return (
    <>
      <Dialog
        isOpen={isOpen && !confirmOpen}
        onClose={onClose}
        titleElement={translation('loadTaskPresetTitle')}
        description={null}
        position="center"
        isModal={true}
        className="max-w-lg w-full"
      >
        <FocusTrapWrapper active={isOpen && !confirmOpen}>
          <div className="flex flex-col gap-4 py-2">
            {loading && <div className="text-description">{translation('loading')}</div>}
            {!loading && presets.length === 0 && (
              <div className="text-description">{translation('taskPresetEmptyList')}</div>
            )}
            {!loading && presets.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="typography-label-lg">{translation('taskPresets')}</span>
                <Select
                  value={selectedId}
                  onValueChange={v => setSelectedId(v)}
                  buttonProps={{
                    className: 'w-full',
                  }}
                >
                  {presets.map(p => (
                    <SelectOption key={p.id} value={p.id} label={p.name}>
                      {p.name}
                    </SelectOption>
                  ))}
                </Select>
                {selected && taskCount === 0 && (
                  <div className="text-warning text-sm">{translation('taskPresetNoTasks')}</div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <Button color="neutral" coloringStyle="outline" onClick={onClose}>
                {translation('cancel')}
              </Button>
              <Button
                color="primary"
                onClick={handlePrimary}
                disabled={!selectedId || taskCount === 0 || applying}
              >
                {translation('confirm')}
              </Button>
            </div>
          </div>
        </FocusTrapWrapper>
      </Dialog>

      <Dialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        titleElement={translation('confirm')}
        description={null}
        position="center"
        isModal={true}
        className="max-w-md w-full"
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-description">
            {translation('loadTaskPresetConfirm', { count: taskCount })}
          </p>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button color="neutral" coloringStyle="outline" onClick={() => setConfirmOpen(false)}>
              {translation('cancel')}
            </Button>
            <Button color="primary" onClick={handleConfirmApply} disabled={applying}>
              {translation('confirm')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
