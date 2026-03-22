import { PatientState, Sex } from '@/api/gql/generated'
import type { PatientViewModel } from '@/components/tables/PatientList'

export const MOCK_PATIENT_A_ID = 'mock-patient-a'
export const MOCK_PATIENT_B_ID = 'mock-patient-b'
export const MOCK_PATIENT_C_ID = 'mock-patient-c'
export const MOCK_PATIENT_D_ID = 'mock-patient-d'
export const MOCK_PATIENT_E_ID = 'mock-patient-e'

const mockBirthdateA = new Date(1965, 2, 15)
const mockBirthdateB = new Date(1970, 8, 1)
const mockBirthdateC = new Date(1980, 5, 20)
const mockBirthdateD = new Date(1975, 11, 8)
const mockBirthdateE = new Date(1988, 1, 14)

export const MOCK_PATIENT_A: PatientViewModel = {
  id: MOCK_PATIENT_A_ID,
  name: 'Patient A',
  firstname: 'Patient',
  lastname: 'A',
  position: null,
  openTasksCount: 0,
  closedTasksCount: 0,
  birthdate: mockBirthdateA,
  sex: Sex.Male,
  state: PatientState.Admitted,
  tasks: [],
  properties: [],
}

export const MOCK_PATIENT_B: PatientViewModel = {
  id: MOCK_PATIENT_B_ID,
  name: 'Patient B',
  firstname: 'Patient',
  lastname: 'B',
  position: null,
  openTasksCount: 0,
  closedTasksCount: 0,
  birthdate: mockBirthdateB,
  sex: Sex.Female,
  state: PatientState.Admitted,
  tasks: [],
  properties: [],
}

export const MOCK_PATIENT_C: PatientViewModel = {
  id: MOCK_PATIENT_C_ID,
  name: 'Patient C',
  firstname: 'Patient',
  lastname: 'C',
  position: null,
  openTasksCount: 0,
  closedTasksCount: 0,
  birthdate: mockBirthdateC,
  sex: Sex.Female,
  state: PatientState.Admitted,
  tasks: [],
  properties: [],
}

export const MOCK_PATIENT_D: PatientViewModel = {
  id: MOCK_PATIENT_D_ID,
  name: 'Patient D',
  firstname: 'Patient',
  lastname: 'D',
  position: null,
  openTasksCount: 0,
  closedTasksCount: 0,
  birthdate: mockBirthdateD,
  sex: Sex.Male,
  state: PatientState.Admitted,
  tasks: [],
  properties: [],
}

export const MOCK_PATIENT_E: PatientViewModel = {
  id: MOCK_PATIENT_E_ID,
  name: 'Patient E',
  firstname: 'Patient',
  lastname: 'E',
  position: null,
  openTasksCount: 0,
  closedTasksCount: 0,
  birthdate: mockBirthdateE,
  sex: Sex.Male,
  state: PatientState.Admitted,
  tasks: [],
  properties: [],
}

export const MOCK_PATIENTS: PatientViewModel[] = [MOCK_PATIENT_A, MOCK_PATIENT_B, MOCK_PATIENT_C, MOCK_PATIENT_D, MOCK_PATIENT_E]
