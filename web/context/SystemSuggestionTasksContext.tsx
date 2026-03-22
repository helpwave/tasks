import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MachineGeneratedTask } from '@/types/systemSuggestion'
import type { SuggestedTaskItem } from '@/types/systemSuggestion'

type ToastState = { message: string } | null

type SystemSuggestionTasksContextValue = {
  getCreatedTasksForPatient: (patientId: string) => MachineGeneratedTask[]
  addCreatedTasks: (
    patientId: string,
    items: SuggestedTaskItem[],
    assignToMe?: boolean
  ) => void
  setCreatedTaskDone: (patientId: string, taskId: string, done: boolean) => void
  toast: ToastState
  showToast: (message: string) => void
  clearToast: () => void
}

const SystemSuggestionTasksContext = createContext<SystemSuggestionTasksContextValue | null>(null)

const TOAST_DURATION_MS = 3000

function generateTaskId(): string {
  return `suggestion-created-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function SystemSuggestionTasksProvider({ children }: { children: ReactNode }) {
  const [createdByPatientId, setCreatedByPatientId] = useState<Record<string, MachineGeneratedTask[]>>({})
  const [toast, setToast] = useState<ToastState>(null)

  const getCreatedTasksForPatient = useCallback((patientId: string): MachineGeneratedTask[] => {
    return createdByPatientId[patientId] ?? []
  }, [createdByPatientId])

  const addCreatedTasks = useCallback(
    (patientId: string, items: SuggestedTaskItem[], assignToMe?: boolean) => {
      const now = new Date()
      const newTasks: MachineGeneratedTask[] = items.map((item) => ({
        id: generateTaskId(),
        title: item.title,
        description: item.description ?? null,
        done: false,
        patientId,
        machineGenerated: true,
        source: 'systemSuggestion',
        assignedTo: assignToMe ? 'me' : null,
        updateDate: now,
        dueDate: null,
        priority: null,
        estimatedTime: null,
      }))
      setCreatedByPatientId((prev) => {
        const existing = prev[patientId] ?? []
        return { ...prev, [patientId]: [...existing, ...newTasks] }
      })
    },
    []
  )

  const setCreatedTaskDone = useCallback((patientId: string, taskId: string, done: boolean) => {
    setCreatedByPatientId((prev) => {
      const list = prev[patientId] ?? []
      const next = list.map((t) => (t.id === taskId ? { ...t, done } : t))
      return { ...prev, [patientId]: next }
    })
  }, [])

  const showToast = useCallback((message: string) => {
    setToast({ message })
  }, [])

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(t)
  }, [toast])

  const value = useMemo(
    () => ({
      getCreatedTasksForPatient,
      addCreatedTasks,
      setCreatedTaskDone,
      toast,
      showToast,
      clearToast,
    }),
    [getCreatedTasksForPatient, addCreatedTasks, setCreatedTaskDone, toast, showToast, clearToast]
  )

  return (
    <SystemSuggestionTasksContext.Provider value={value}>
      {children}
    </SystemSuggestionTasksContext.Provider>
  )
}

export function useSystemSuggestionTasks(): SystemSuggestionTasksContextValue {
  const ctx = useContext(SystemSuggestionTasksContext)
  if (!ctx) {
    throw new Error('useSystemSuggestionTasks must be used within SystemSuggestionTasksProvider')
  }
  return ctx
}

export function useSystemSuggestionTasksOptional(): SystemSuggestionTasksContextValue | null {
  return useContext(SystemSuggestionTasksContext)
}

export function useCreatedTasksForPatient(patientId: string): MachineGeneratedTask[] {
  const ctx = useSystemSuggestionTasksOptional()
  return ctx ? ctx.getCreatedTasksForPatient(patientId) : []
}
