import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SafeMutationOptions } from './useSafeMutation'
import { useSafeMutation } from './useSafeMutation'

export interface AtomicMutationOptions<TData, TVariables> extends Omit<SafeMutationOptions<TData, TVariables, unknown>, 'mutationFn' | 'onMutate' | 'onSuccess' | 'onError'> {
  mutationFn: (variables: TVariables) => Promise<TData>,
  timeoutMs?: number,
  immediateFields?: (keyof TVariables)[],
  onChangeFields?: (keyof TVariables)[],
  onBlurFields?: (keyof TVariables)[],
  onCloseFields?: (keyof TVariables)[],
  getChecksum?: (data: TData) => string | null | undefined,
  optimisticUpdate?: (variables: TVariables) => {
    queryKey: unknown[],
    updateFn: (oldData: unknown) => unknown,
  }[],
}

export function useAtomicMutation<TData, TVariables extends Record<string, unknown>>({
  mutationFn,
  timeoutMs = 3000,
  immediateFields = [],
  onChangeFields = [],
  onBlurFields = [],
  onCloseFields = [],
  getChecksum,
  ...safeMutationOptions
}: AtomicMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()
  const [pendingUpdates, setPendingUpdates] = useState<Partial<TVariables>>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Partial<TVariables>>({})

  const { mutate, isLoading } = useSafeMutation({
    ...safeMutationOptions,
    optimisticUpdate: safeMutationOptions.optimisticUpdate,
    mutationFn: async (variables: TVariables) => {
      const currentData = queryClient.getQueryData<TData>(safeMutationOptions.queryKey || [])
      const checksum = currentData && getChecksum ? getChecksum(currentData) : undefined

      let variablesWithChecksum = { ...variables }

      if (checksum && 'data' in variablesWithChecksum && variablesWithChecksum['data'] && typeof variablesWithChecksum['data'] === 'object' && !Array.isArray(variablesWithChecksum['data'])) {
        variablesWithChecksum = {
          ...variablesWithChecksum,
          ['data']: { ...variablesWithChecksum['data'] as Record<string, unknown>, checksum } as TVariables['data']
        } as TVariables
      }

      return mutationFn(variablesWithChecksum)
    },
  })

  const executeMutation = useCallback((updates: Partial<TVariables>) => {
    if (Object.keys(updates).length === 0) {
      return
    }

    const mutationVariables = { ...updates } as TVariables
    const dataKey = 'data' as keyof TVariables
    if (dataKey in mutationVariables && mutationVariables[dataKey] && typeof mutationVariables[dataKey] === 'object' && !Array.isArray(mutationVariables[dataKey])) {
      const dataObj = mutationVariables[dataKey] as Record<string, unknown>
      if (Object.keys(dataObj).length === 0) {
        return
      }
    }

    const idKey = 'id' as keyof TVariables
    if (!(idKey in mutationVariables) || !mutationVariables[idKey]) {
      if (safeMutationOptions.queryKey && safeMutationOptions.queryKey[1] && typeof safeMutationOptions.queryKey[1] === 'object' && 'id' in safeMutationOptions.queryKey[1]) {
        (mutationVariables as Record<string, unknown>)['id'] = (safeMutationOptions.queryKey[1] as { id: string }).id
      }
    }

    if (!(dataKey in mutationVariables) || !mutationVariables[dataKey]) {
      return
    }

    mutate(mutationVariables)
  }, [mutate, safeMutationOptions.queryKey])

  const updateField = useCallback((updates: Partial<TVariables>, triggerType?: 'onChange' | 'onBlur' | 'onClose') => {
    const mergedPending: Record<string, unknown> = { ...pendingUpdatesRef.current as Record<string, unknown> }

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'data' && 'data' in mergedPending && mergedPending['data'] && typeof mergedPending['data'] === 'object' && value && typeof value === 'object' && !Array.isArray(value) && !Array.isArray(mergedPending['data'])) {
        mergedPending['data'] = { ...(mergedPending['data'] as Record<string, unknown>), ...(value as Record<string, unknown>) }
      } else {
        mergedPending[key] = value
      }
    }

    pendingUpdatesRef.current = mergedPending as Partial<TVariables>
    setPendingUpdates(mergedPending as Partial<TVariables>)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const checkHasImmediateField = (updatesToCheck: Partial<TVariables>, fieldsToCheck: (keyof TVariables)[]): boolean => {
      if ('data' in updatesToCheck && updatesToCheck['data'] && typeof updatesToCheck['data'] === 'object' && !Array.isArray(updatesToCheck['data'])) {
        const dataObj = updatesToCheck['data'] as Record<string, unknown>
        return Object.keys(dataObj).some(dataKey => fieldsToCheck.includes(dataKey as keyof TVariables))
      }
      return Object.keys(updatesToCheck).some(key => fieldsToCheck.includes(key as keyof TVariables))
    }

    const allImmediateFields = [...immediateFields, ...onChangeFields]
    const hasImmediateFields = checkHasImmediateField(updates, allImmediateFields)

    if (triggerType === 'onChange' && onChangeFields.length > 0) {
      const hasOnChangeFields = checkHasImmediateField(updates, onChangeFields)
      if (hasOnChangeFields) {
        executeMutation(mergedPending as Partial<TVariables>)
        pendingUpdatesRef.current = {} as Partial<TVariables>
        setPendingUpdates({})
        return
      }
    }

    if (triggerType === 'onBlur' && onBlurFields.length > 0) {
      const hasOnBlurFields = checkHasImmediateField(updates, onBlurFields)
      if (hasOnBlurFields) {
        executeMutation(mergedPending as Partial<TVariables>)
        pendingUpdatesRef.current = {} as Partial<TVariables>
        setPendingUpdates({})
        return
      }
    }

    if (triggerType === 'onClose' && onCloseFields.length > 0) {
      const hasOnCloseFields = checkHasImmediateField(updates, onCloseFields)
      if (hasOnCloseFields) {
        executeMutation(mergedPending as Partial<TVariables>)
        pendingUpdatesRef.current = {} as Partial<TVariables>
        setPendingUpdates({})
        return
      }
    }

    if (hasImmediateFields) {
      const immediateUpdates: Partial<TVariables> = {}
      const delayedUpdates: Partial<TVariables> = {}

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'data' && value && typeof value === 'object' && !Array.isArray(value)) {
          const immediateData: Record<string, unknown> = {}
          const delayedData: Record<string, unknown> = {}
          const currentPending = pendingUpdatesRef.current as Record<string, unknown>
          const currentData = ('data' in currentPending && currentPending['data'] ? currentPending['data'] as Record<string, unknown> : {}) || {}

          for (const [dataKey, dataValue] of Object.entries(value as Record<string, unknown>)) {
            if (allImmediateFields.includes(dataKey as keyof TVariables)) {
              immediateData[dataKey] = dataValue
            } else {
              delayedData[dataKey] = dataValue
            }
          }

          if (Object.keys(immediateData).length > 0) {
            (immediateUpdates as Record<string, unknown>)['data'] = { ...currentData, ...immediateData }
          }
          if (Object.keys(delayedData).length > 0) {
            (delayedUpdates as Record<string, unknown>)['data'] = { ...currentData, ...delayedData }
          }
        } else if (allImmediateFields.includes(key as keyof TVariables)) {
          (immediateUpdates as Record<string, unknown>)[key] = value
        } else {
          (delayedUpdates as Record<string, unknown>)[key] = value
        }
      }

      if (Object.keys(immediateUpdates).length > 0) {
        const mergedImmediate: Record<string, unknown> = { ...pendingUpdatesRef.current as Record<string, unknown> }
        for (const [key, value] of Object.entries(immediateUpdates)) {
          if (key === 'data' && 'data' in mergedImmediate && mergedImmediate['data'] && typeof mergedImmediate['data'] === 'object' && !Array.isArray(mergedImmediate['data']) && value && typeof value === 'object' && !Array.isArray(value)) {
            mergedImmediate['data'] = { ...(mergedImmediate['data'] as Record<string, unknown>), ...(value as Record<string, unknown>) }
          } else {
            mergedImmediate[key] = value
          }
        }
        executeMutation(mergedImmediate as Partial<TVariables>)

        const remainingDelayed: Record<string, unknown> = { ...delayedUpdates as Record<string, unknown> }
        if ('id' in mergedImmediate && mergedImmediate['id']) {
          remainingDelayed['id'] = mergedImmediate['id']
        }
        pendingUpdatesRef.current = remainingDelayed as Partial<TVariables>
        setPendingUpdates(remainingDelayed as Partial<TVariables>)
      }

      if (Object.keys(delayedUpdates).length > 0) {
        timeoutRef.current = setTimeout(() => {
          const mergedDelayed: Record<string, unknown> = { ...pendingUpdatesRef.current as Record<string, unknown> }
          for (const [key, value] of Object.entries(delayedUpdates)) {
            if (key === 'data' && 'data' in mergedDelayed && mergedDelayed['data'] && typeof mergedDelayed['data'] === 'object' && !Array.isArray(mergedDelayed['data']) && value && typeof value === 'object' && !Array.isArray(value)) {
              mergedDelayed['data'] = { ...(mergedDelayed['data'] as Record<string, unknown>), ...(value as Record<string, unknown>) }
            } else {
              mergedDelayed[key] = value
            }
          }
          executeMutation(mergedDelayed as Partial<TVariables>)
          pendingUpdatesRef.current = {} as Partial<TVariables>
          setPendingUpdates({})
        }, timeoutMs)
      }
    } else {
      timeoutRef.current = setTimeout(() => {
        executeMutation(pendingUpdatesRef.current)
        pendingUpdatesRef.current = {} as Partial<TVariables>
        setPendingUpdates({})
      }, timeoutMs)
    }
  }, [executeMutation, timeoutMs, immediateFields, onChangeFields, onBlurFields, onCloseFields])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      executeMutation(pendingUpdatesRef.current)
      pendingUpdatesRef.current = {}
      setPendingUpdates({})
    }
  }, [executeMutation])

  return {
    updateField,
    flush,
    isUpdating: isLoading,
    pendingUpdates,
  }
}

