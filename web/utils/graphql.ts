export const UNSET = Symbol('UNSET')

export type UnsetValue = typeof UNSET

export function isUnset(value: unknown): value is UnsetValue {
  return value === UNSET
}

export function cleanGraphQLInput<T extends Record<string, unknown>>(
  input: T
): Partial<T> {
  const cleaned: Partial<T> = {}

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue
    }
    if (isUnset(value)) {
      cleaned[key as keyof T] = null as T[keyof T]
    } else {
      cleaned[key as keyof T] = value as T[keyof T]
    }
  }

  return cleaned
}

export function createPartialUpdate<T extends Record<string, unknown>>(
  updates: Partial<T>,
  currentData?: T | null
): Partial<T> {
  const result: Partial<T> = {}

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue
    }

    if (isUnset(value)) {
      result[key as keyof T] = null as T[keyof T]
    } else if (currentData && currentData[key as keyof T] !== value) {
      result[key as keyof T] = value as T[keyof T]
    } else if (!currentData) {
      result[key as keyof T] = value as T[keyof T]
    }
  }

  return result
}

export function extractConflictError(error: unknown): {
  isConflict: boolean,
  message: string,
  expectedChecksum?: string,
  gotChecksum?: string,
} {
  const errorMessage = error instanceof Error ? error.message : String(error)

  let extensions: Record<string, unknown> | undefined

  if (error && typeof error === 'object' && 'extensions' in error) {
    extensions = (error as { extensions?: Record<string, unknown> }).extensions
  }

  if (errorMessage.includes('CONFLICT') || extensions?.['code'] === 'CONFLICT') {
    const expectedChecksum = extensions?.['expectedChecksum'] as string | undefined
    const gotChecksum = extensions?.['gotChecksum'] as string | undefined

    if (!expectedChecksum || !gotChecksum) {
      const expectedMatch = errorMessage.match(/Expected checksum: ([^\s,]+)/)
      const gotMatch = errorMessage.match(/Got: ([^\s,]+)/)

      return {
        isConflict: true,
        message: errorMessage,
        expectedChecksum: expectedMatch?.[1] || expectedChecksum,
        gotChecksum: gotMatch?.[1] || gotChecksum,
      }
    }

    return {
      isConflict: true,
      message: errorMessage,
      expectedChecksum,
      gotChecksum,
    }
  }

  return {
    isConflict: false,
    message: errorMessage,
  }
}

