import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  FocusTrapWrapper,
  TabList,
  TabPanel,
  TabSwitcher
} from '@helpwave/hightide'
import { ArrowRight, BookCheck, Workflow } from 'lucide-react'
import type { GuidelineAdherenceStatus } from '@/types/systemSuggestion'
import type { SystemSuggestion } from '@/types/systemSuggestion'
import { useSystemSuggestionTasks } from '@/context/SystemSuggestionTasksContext'
import { useApplyTaskGraph } from '@/data'
import { GetPatientDocument } from '@/api/gql/generated'
import { suggestionItemsToTaskGraphInput } from '@/utils/taskGraph'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'

type SystemSuggestionModalProps = {
  isOpen: boolean,
  onClose: () => void,
  suggestion: SystemSuggestion,
  patientName?: string,
  onApplied?: () => void,
}

const ADHERENCE_LABEL: Record<GuidelineAdherenceStatus, string> = {
  adherent: 'Adherent',
  non_adherent: 'Not adherent',
  unknown: 'In Progress',
}

function adherenceToChipColor(status: GuidelineAdherenceStatus): 'positive' | 'negative' | 'warning' {
  switch (status) {
  case 'adherent':
    return 'positive'
  case 'non_adherent':
    return 'negative'
  default:
    return 'warning'
  }
}

export function SystemSuggestionModal({
  isOpen,
  onClose,
  suggestion,
  patientName,
  onApplied,
}: SystemSuggestionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(suggestion.suggestedTasks.map((t) => t.id)))
  const [activeTabId, setActiveTabId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(suggestion.suggestedTasks.map((t) => t.id)))
      setActiveTabId(undefined)
    }
  }, [isOpen, suggestion.suggestedTasks])

  const { showToast } = useSystemSuggestionTasks()
  const translation = useTasksTranslation()
  const [applyTaskGraph, { loading: applyLoading }] = useApplyTaskGraph()

  const toggleTask = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectedItems = useMemo(
    () => suggestion.suggestedTasks.filter((t) => selectedIds.has(t.id)),
    [suggestion.suggestedTasks, selectedIds]
  )

  const handleCreate = useCallback(async () => {
    if (selectedItems.length === 0) return
    const graph = suggestionItemsToTaskGraphInput(selectedItems)
    await applyTaskGraph({
      variables: {
        data: {
          patientId: suggestion.patientId,
          graph,
          assignToCurrentUser: false,
        },
      },
      refetchQueries: [
        { query: GetPatientDocument, variables: { id: suggestion.patientId } },
      ],
    })
    showToast(translation('tasksCreatedFromPreset'))
    onApplied?.()
    onClose()
  }, [
    applyTaskGraph,
    selectedItems,
    suggestion.patientId,
    showToast,
    translation,
    onApplied,
    onClose,
  ])

  const handleCreateAndAssign = useCallback(async () => {
    if (selectedItems.length === 0) return
    const graph = suggestionItemsToTaskGraphInput(selectedItems)
    await applyTaskGraph({
      variables: {
        data: {
          patientId: suggestion.patientId,
          graph,
          assignToCurrentUser: true,
        },
      },
      refetchQueries: [
        { query: GetPatientDocument, variables: { id: suggestion.patientId } },
      ],
    })
    showToast(translation('tasksCreatedFromPreset'))
    onApplied?.()
    onClose()
  }, [
    applyTaskGraph,
    selectedItems,
    suggestion.patientId,
    showToast,
    translation,
    onApplied,
    onClose,
  ])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement="System suggestion"
      description={patientName ? `Suggestions for ${patientName}` : undefined}
      position="center"
      isModal={true}
      className="max-w-2xl w-full max-h-[90vh] flex flex-col"
    >
      <FocusTrapWrapper active={isOpen}>
        <div className="flex flex-col overflow-hidden flex-1 min-h-0 py-2">
          <TabSwitcher
            activeId={activeTabId}
            onActiveIdChange={(id) => setActiveTabId(id ?? undefined)}
            initialActiveId="Suggestion"
          >
            <TabList className="mt-4 mb-4" />
            <TabPanel label="Suggestion" className="flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="flex flex-col gap-6 overflow-y-auto flex-1 pr-2 pb-2">
                <section className="mb-2">
                  <div className="text-sm font-medium text-label mb-2">Guideline adherence</div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Chip
                      color={adherenceToChipColor(suggestion.adherenceStatus)}
                      coloringStyle="tonal"
                      size="sm"
                    >
                      {ADHERENCE_LABEL[suggestion.adherenceStatus]}
                    </Chip>
                  </div>
                  <p className="text-sm text-description leading-relaxed">{suggestion.reasonSummary}</p>
                </section>

                <section className="mb-2">
                  <div className="text-sm font-medium text-label mb-3">Suggested tasks</div>
                  <div className="flex flex-col gap-3 min-h-[18rem] max-h-96 overflow-y-auto">
                    {suggestion.suggestedTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-surface-variant cursor-pointer"
                      >
                        <Checkbox
                          value={selectedIds.has(task.id)}
                          onValueChange={() => toggleTask(task.id)}
                          className="shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{task.title}</span>
                            <Chip color="secondary" coloringStyle="tonal" size="xs">
                              Suggested
                            </Chip>
                          </div>
                          {task.description && (
                            <p className="text-sm text-description mt-1.5">{task.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap gap-3 justify-end pt-6 mt-6 border-t border-divider shrink-0">
                <Button color="neutral" onClick={onClose} coloringStyle="outline">
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={() => void handleCreateAndAssign()}
                  coloringStyle="outline"
                  disabled={selectedItems.length === 0 || applyLoading}
                >
                  Create & assign to me
                </Button>
                <Button
                  color="primary"
                  onClick={() => void handleCreate()}
                  disabled={selectedItems.length === 0 || applyLoading}
                >
                  Create
                </Button>
              </div>
            </TabPanel>

            <TabPanel label="Explanation" className="flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="flex flex-col gap-6 overflow-y-auto flex-1 py-2 pb-4">
                <section className="mb-4">
                  <div className="text-sm font-medium text-label mb-3">Explanation</div>
                  <p className="text-sm text-description whitespace-pre-wrap leading-relaxed">
                    {suggestion.explanation.details}
                  </p>
                </section>
                <section>
                  <div className="text-sm font-medium text-label mb-3">Model</div>
                  <div className="flex items-center gap-2 py-6 px-4 rounded-lg border border-border bg-surface-variant">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-primary bg-surface flex items-center justify-center" />
                      <span className="text-xs text-description text-center max-w-[140px] truncate" title="GIVE_FLUIDS_AFTER_INITIAL_BOLUS">
                        GIVE_FLUIDS_AFTER_INITIAL_BOLUS
                      </span>
                    </div>
                    <div className="flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1 px-2">
                      <ArrowRight className="size-8 text-description shrink-0" aria-hidden />
                      <span className="text-xs font-medium text-label">Response</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-primary bg-surface flex items-center justify-center" />
                      <span className="text-xs text-description text-center max-w-[140px] truncate" title="SIGNS_OF_HYPOPERFUSION_PERSIST">
                        SIGNS_OF_HYPOPERFUSION_PERSIST
                      </span>
                    </div>
                  </div>
                </section>
                <section>
                  <div className="text-sm font-medium text-label mb-3">References</div>
                  <div className="flex flex-wrap gap-3">
                    <Button color="primary" coloringStyle="outline" size="sm" className="flex items-center gap-2">
                      <BookCheck className="size-4" />
                      View Standard
                    </Button>
                    <Button color="positive" coloringStyle="outline" size="sm" className="flex items-center gap-2">
                      <Workflow className="size-4" />
                      Model Viewer
                    </Button>
                  </div>
                </section>
              </div>
            </TabPanel>
          </TabSwitcher>
        </div>
      </FocusTrapWrapper>
    </Dialog>
  )
}
