import type { GuidelineAdherenceStatus, SystemSuggestion } from '@/types/systemSuggestion'
import { MOCK_PATIENT_A_ID, MOCK_PATIENT_B_ID, MOCK_PATIENT_C_ID, MOCK_PATIENT_D_ID, MOCK_PATIENT_E_ID } from '@/data/mockPatients'

export const MOCK_SUGGESTION_FOR_PATIENT_A: SystemSuggestion = {
  id: 'mock-suggestion-a',
  patientId: MOCK_PATIENT_A_ID,
  adherenceStatus: 'non_adherent',
  reasonSummary: 'Current treatment plan does not align with guideline recommendations for this condition. Recommended tasks address screening and follow-up intervals that have been missed.',
  suggestedTasks: [
    { id: 'sug-1', title: 'Schedule guideline-recommended screening', description: 'Book lab and imaging per protocol.' },
    { id: 'sug-2', title: 'Document treatment rationale', description: 'Record clinical reasoning for any deviation from guidelines.' },
    { id: 'sug-3', title: 'Plan follow-up within 4 weeks', description: 'Set reminder for next review date.' },
  ],
  explanation: {
    details: 'The recommendation is shown because de-facto treatment of this patient is not adherent with the de-jure models. The suggested tasks are derived from evidence-based protocols to improve adherence and outcomes.',
    references: [
      { title: 'Clinical guideline (PDF)', url: 'https://example.com/guideline.pdf' },
      { title: 'Supporting literature', url: 'https://example.com/literature' },
    ],
  },
  createdAt: new Date().toISOString(),
}

export const MOCK_SUGGESTION_FOR_PATIENT_E: SystemSuggestion = {
  id: 'mock-suggestion-e',
  patientId: MOCK_PATIENT_E_ID,
  adherenceStatus: 'adherent',
  reasonSummary: 'Guideline targets are met. Optional follow-up tasks may help maintain adherence and document progress.',
  suggestedTasks: [
    { id: 'sug-e1', title: 'Optional: Schedule next routine review', description: 'Book follow-up within 6 months.' },
    { id: 'sug-e2', title: 'Optional: Update care plan summary', description: 'Keep documentation in sync with current status.' },
  ],
  explanation: {
    details: 'The recommendation is shown because de-facto treatment is not fully aligned with de-jure models. The suggested tasks are derived as optional improvements to support ongoing adherence and documentation.',
    references: [
      { title: 'Follow-up protocol', url: 'https://example.com/follow-up.pdf' },
    ],
  },
  createdAt: new Date().toISOString(),
}

const adherenceByPatientId: Record<string, GuidelineAdherenceStatus> = {
  [MOCK_PATIENT_A_ID]: 'non_adherent',
  [MOCK_PATIENT_B_ID]: 'adherent',
  [MOCK_PATIENT_C_ID]: 'adherent',
  [MOCK_PATIENT_D_ID]: 'adherent',
  [MOCK_PATIENT_E_ID]: 'adherent',
}

const suggestionByPatientId: Record<string, SystemSuggestion> = {
  [MOCK_PATIENT_A_ID]: MOCK_SUGGESTION_FOR_PATIENT_A,
  [MOCK_PATIENT_E_ID]: MOCK_SUGGESTION_FOR_PATIENT_E,
}

export function getAdherenceByPatientId(patientId: string): GuidelineAdherenceStatus {
  return adherenceByPatientId[patientId] ?? 'unknown'
}

export function getSuggestionByPatientId(patientId: string): SystemSuggestion | null {
  return suggestionByPatientId[patientId] ?? null
}

export const DUMMY_SUGGESTION: SystemSuggestion = {
  id: 'dummy',
  patientId: '',
  adherenceStatus: 'unknown',
  reasonSummary: '',
  suggestedTasks: [],
  explanation: { details: '', references: [] },
}
