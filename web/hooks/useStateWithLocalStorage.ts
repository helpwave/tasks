import type { Dispatch, SetStateAction } from 'react'
import { useState, useEffect } from 'react'

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key)
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

const saveToLocalStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export interface useStateWithLocalStorageProps<T> {
  key: string,
  defaultValue: T,
}

export const useStateWithLocalStorage = <T>({
  key,
  defaultValue
}: useStateWithLocalStorageProps<T>): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => loadFromLocalStorage(key, defaultValue))

  useEffect(() => {
    saveToLocalStorage(key, value)
  }, [key, value])
  return [value, setValue]
}
