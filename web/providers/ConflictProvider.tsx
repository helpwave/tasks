'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { RunnerConflictChoice } from '@/hooks/useMutationWithConflict'
import { useMutationWithConflict } from '@/hooks/useMutationWithConflict'

type ConflictContextValue = {
  onConflict: (error: Error, variables: unknown) => Promise<RunnerConflictChoice>,
}

const ConflictContext = createContext<ConflictContextValue | null>(null)

export function useConflictOnConflict(): ConflictContextValue['onConflict'] | null {
  const ctx = useContext(ConflictContext)
  return ctx?.onConflict ?? null
}

export function ConflictProvider({ children }: { children: ReactNode }) {
  const { onConflict, ConflictDialog } = useMutationWithConflict()
  const value: ConflictContextValue = { onConflict }
  return (
    <ConflictContext.Provider value={value}>
      {children}
      <ConflictDialog />
    </ConflictContext.Provider>
  )
}
