import { useState, useCallback } from 'react'
import type { ConflictResolutionChoice } from '@/components/ConflictResolutionDialog'

export interface ConflictState {
  isOpen: boolean,
  error: Error | null,
  variables: unknown,
  context: unknown,
  resolve: (choice: ConflictResolutionChoice) => void,
  reject: () => void,
}

export function useConflictResolution() {
  const [conflictState, setConflictState] = useState<ConflictState | null>(null)

  const handleConflict = useCallback((
    error: Error,
    variables: unknown,
    context: unknown
  ): Promise<ConflictResolutionChoice> => {
    return new Promise((resolve, reject) => {
      setConflictState({
        isOpen: true,
        error,
        variables,
        context,
        resolve: (choice: ConflictResolutionChoice) => {
          setConflictState(null)
          resolve(choice)
        },
        reject: () => {
          setConflictState(null)
          reject(new Error('Conflict resolution cancelled'))
        },
      })
    })
  }, [])

  const closeConflict = useCallback(() => {
    if (conflictState) {
      conflictState.reject()
    }
  }, [conflictState])

  return {
    conflictState,
    handleConflict,
    closeConflict,
  }
}

