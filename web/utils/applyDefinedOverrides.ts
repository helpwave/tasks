export function applyDefinedOverrides<T extends object>(
  defaults: T,
  overrides?: Partial<T> | null
): T {
  if (!overrides) {
    return defaults
  }

  const result = { ...defaults }

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    if (overrides[key] !== undefined) {
      result[key] = overrides[key] as T[keyof T]
    }
  }

  return result
}
