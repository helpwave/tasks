export type GuidelineAdherenceStatus = 'adherent' | 'non_adherent' | 'unknown'

export type SuggestedTaskItem = {
  id: string
  title: string
  description?: string
}

export type SystemSuggestionExplanation = {
  details: string
  references: Array<{ title: string; url: string }>
}

export type SystemSuggestion = {
  id: string
  patientId: string
  adherenceStatus: GuidelineAdherenceStatus
  reasonSummary: string
  suggestedTasks: SuggestedTaskItem[]
  explanation: SystemSuggestionExplanation
  createdAt?: string
}

export type TaskSource = 'manual' | 'systemSuggestion'

export type MachineGeneratedTask = {
  id: string
  title: string
  description?: string | null
  done: boolean
  patientId: string
  machineGenerated: true
  source: 'systemSuggestion'
  assignedTo?: 'me' | null
  updateDate: Date
  dueDate?: Date | null
  priority?: string | null
  estimatedTime?: number | null
}
