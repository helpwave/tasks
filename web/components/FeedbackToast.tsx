import { Chip } from '@helpwave/hightide'
import { useSystemSuggestionTasksOptional } from '@/context/SystemSuggestionTasksContext'

export function FeedbackToast() {
  const ctx = useSystemSuggestionTasksOptional()
  const toast = ctx?.toast ?? null

  if (!toast) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <Chip
        color="neutral"
        coloringStyle="solid"
        size="md"
        className="shadow-lg px-4 py-2"
      >
        {toast.message}
      </Chip>
    </div>
  )
}
