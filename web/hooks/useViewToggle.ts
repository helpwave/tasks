import { useState, useEffect } from 'react'

type ViewType = 'table' | 'card'

const STORAGE_KEY_PATIENT = 'patient-view-type'
const STORAGE_KEY_TASK = 'task-view-type'

export const usePatientViewToggle = () => {
  const [viewType, setViewType] = useState<ViewType>('table')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_PATIENT) as ViewType | null
      if (stored === 'table' || stored === 'card') {
        setViewType(stored)
      }
    }
  }, [])

  const toggleView = (newViewType: ViewType) => {
    setViewType(newViewType)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PATIENT, newViewType)
    }
  }

  return { viewType, toggleView }
}

export const useTaskViewToggle = () => {
  const [viewType, setViewType] = useState<ViewType>('table')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_TASK) as ViewType | null
      if (stored === 'table' || stored === 'card') {
        setViewType(stored)
      }
    }
  }, [])

  const toggleView = (newViewType: ViewType) => {
    setViewType(newViewType)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TASK, newViewType)
    }
  }

  return { viewType, toggleView }
}

