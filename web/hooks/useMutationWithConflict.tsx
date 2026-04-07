import { useCallback } from 'react'
import type { ConflictResolutionChoice } from '@/components/ConflictResolutionDialog'
import { ConflictResolutionDialog } from '@/components/ConflictResolutionDialog'
import { useConflictResolution } from './useConflictResolution'

export type RunnerConflictChoice = 'retry' | 'use-server' | 'keep-local'

export function dialogChoiceToRunnerChoice(
  choice: ConflictResolutionChoice
): RunnerConflictChoice {
  if (choice === 'keep-local') return 'retry'
  if (choice === 'use-server' || choice === 'merge') return 'use-server'
  return 'use-server'
}

export function useMutationWithConflict() {
  const { conflictState, handleConflict, closeConflict } = useConflictResolution()

  const onConflict = useCallback(
    async (error: Error, variables: unknown): Promise<RunnerConflictChoice> => {
      const choice = await handleConflict(error, variables, undefined)
      return dialogChoiceToRunnerChoice(choice)
    },
    [handleConflict]
  )

  const ConflictDialog = useCallback(() => {
    if (!conflictState) return null
    return (
      <ConflictResolutionDialog
        isOpen={conflictState.isOpen}
        onClose={closeConflict}
        onResolve={conflictState.resolve}
        message={conflictState.error?.message ?? 'A conflict occurred.'}
      />
    )
  }, [conflictState, closeConflict])

  return { onConflict, conflictState, ConflictDialog }
}
