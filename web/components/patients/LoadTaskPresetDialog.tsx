import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  FocusTrapWrapper,
  Select,
  SelectOption
} from '@helpwave/hightide'
import { Check, Plus, UserPlus, X } from 'lucide-react'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import { useApplyTaskGraph, useTaskPresets } from '@/data'
import { GetPatientDocument, type TaskPresetsQuery } from '@/api/gql/generated'
import { useSystemSuggestionTasks } from '@/context/SystemSuggestionTasksContext'
import { presetGraphToTaskGraphInput } from '@/utils/taskGraph'

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
  const { showToast } = useSystemSuggestionTasks()
  const { data, loading, refetch: refetchPresets } = useTaskPresets()
  const [applyTaskGraph, { loading: applying }] = useApplyTaskGraph()
  const wasDialogOpenRef = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set())

  const presets = useMemo(() => data?.taskPresets ?? [], [data?.taskPresets])

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null)
      setConfirmOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !wasDialogOpenRef.current) {
      void refetchPresets()
    }
    wasDialogOpenRef.current = isOpen
  }, [isOpen, refetchPresets])

  useEffect(() => {
    if (!isOpen || presets.length === 0) return
    setSelectedId((prev) => {
      const first = presets[0]
      if (!first) return prev
      return prev != null && presets.some((p) => p.id === prev) ? prev : first.id
    })
  }, [isOpen, presets])

  const selected: PresetRow | undefined = useMemo(
    () => presets.find(p => p.id === selectedId),
    [presets, selectedId]
  )

  const taskCount = selected?.graph.nodes.length ?? 0
  const selectedApplyCount = selectedNodeIds.size

  useEffect(() => {
    if (!confirmOpen || !selected) return
    setSelectedNodeIds(new Set(selected.graph.nodes.map((n) => n.id)))
  }, [confirmOpen, selected])

  const handlePrimary = useCallback(() => {
    if (!selectedId || taskCount === 0) return
    setConfirmOpen(true)
  }, [selectedId, taskCount])

  const toggleNode = useCallback((nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const handleConfirmApply = useCallback(
    async (assignToCurrentUser: boolean) => {
      if (!selected) return
      const graph = presetGraphToTaskGraphInput(selected.graph, selectedNodeIds)
      if (!graph) return
      await applyTaskGraph({
        variables: {
          data: {
            patientId,
            graph,
            sourcePresetId: selected.id,
            assignToCurrentUser,
          },
        },
        refetchQueries: [{ query: GetPatientDocument, variables: { id: patientId } }],
      })
      showToast(translation('tasksCreatedFromPreset'))
      setConfirmOpen(false)
      onClose()
      onSuccess?.()
    },
    [
      applyTaskGraph,
      patientId,
      selected,
      selectedNodeIds,
      showToast,
      translation,
      onClose,
      onSuccess,
    ]
  )

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
                  value={selectedId ?? null}
                  onValueChange={(v) => setSelectedId(v)}
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
              <Button
                color="neutral"
                coloringStyle="outline"
                className="inline-flex items-center gap-2"
                onClick={onClose}
              >
                <X className="size-4 shrink-0" aria-hidden />
                {translation('cancel')}
              </Button>
              <Button
                color="primary"
                className="inline-flex items-center gap-2"
                onClick={handlePrimary}
                disabled={!selectedId || taskCount === 0 || applying}
              >
                <Check className="size-4 shrink-0" aria-hidden />
                {translation('confirm')}
              </Button>
            </div>
          </div>
        </FocusTrapWrapper>
      </Dialog>

      <Dialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        titleElement={translation('loadTaskPresetConfirmTitle')}
        description={
          selected?.name ? (
            <span className="block typography-title-md font-semibold text-label max-w-full break-words">
              {selected.name}
            </span>
          ) : null
        }
        position="center"
        isModal={true}
        className="max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <FocusTrapWrapper active={confirmOpen}>
          <div className="flex flex-col gap-4 py-2 overflow-hidden flex-1 min-h-0">
            <p className="text-description shrink-0">
              {translation('loadTaskPresetConfirm', { count: selectedApplyCount })}
            </p>
            <section className="flex flex-col min-h-0 flex-1">
              <div className="text-sm font-medium text-label mb-3 shrink-0">
                {translation('loadTaskPresetSelectTasks')}
              </div>
              <div className="flex flex-col gap-3 min-h-[12rem] max-h-96 overflow-y-auto pr-1">
                {selected?.graph.nodes.map((task) => (
                  <div
                    key={task.id}
                    role="checkbox"
                    aria-checked={selectedNodeIds.has(task.id)}
                    tabIndex={0}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-surface-variant cursor-pointer text-left w-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onClick={() => toggleNode(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault()
                        toggleNode(task.id)
                      }
                      if (e.key === 'Enter') {
                        toggleNode(task.id)
                      }
                    }}
                  >
                    <Checkbox
                      value={selectedNodeIds.has(task.id)}
                      onValueChange={() => toggleNode(task.id)}
                      className="shrink-0 pointer-events-none select-none"
                      tabIndex={-1}
                      aria-hidden={true}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{task.title}</span>
                        <Chip color="secondary" coloringStyle="tonal" size="xs">
                          {translation('loadTaskPresetTaskLabel')}
                        </Chip>
                      </div>
                      {task.description && (
                        <p className="text-sm text-description mt-1.5">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-divider shrink-0">
              <Button color="neutral" coloringStyle="outline" onClick={() => setConfirmOpen(false)}>
                {translation('cancel')}
              </Button>
              <Button
                color="primary"
                coloringStyle="outline"
                className="inline-flex items-center gap-2"
                onClick={() => void handleConfirmApply(true)}
                disabled={selectedApplyCount === 0 || applying}
              >
                <UserPlus className="size-4 shrink-0" aria-hidden />
                {translation('loadTaskPresetCreateAndAssign')}
              </Button>
              <Button
                color="primary"
                className="inline-flex items-center gap-2"
                onClick={() => void handleConfirmApply(false)}
                disabled={selectedApplyCount === 0 || applying}
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                {translation('create')}
              </Button>
            </div>
          </div>
        </FocusTrapWrapper>
      </Dialog>
    </>
  )
}
