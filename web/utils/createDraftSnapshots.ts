import type { PatientState, Sex } from '@/api/gql/generated'

export type PatientCreateDraftSnapshotSource = {
  firstname: string,
  lastname: string,
  birthdate?: string | null,
  sex?: Sex | null,
  assignedLocationIds?: string[] | null,
  state?: PatientState | null,
  description?: string | null,
  clinic?: { id: string } | null,
  position?: { id: string } | null,
  teams?: { id: string }[] | null,
}

export function serializePatientCreateDraft(values: PatientCreateDraftSnapshotSource): string {
  return JSON.stringify({
    firstname: values.firstname ?? '',
    lastname: values.lastname ?? '',
    birthdate: values.birthdate ?? null,
    sex: values.sex ?? null,
    assignedLocationIds: [...(values.assignedLocationIds ?? [])].sort(),
    state: values.state ?? null,
    description: values.description ?? null,
    clinicId: values.clinic?.id ?? null,
    positionId: values.position?.id ?? null,
    teamIds: (values.teams ?? []).map(t => t.id).sort(),
  })
}

export type TaskCreateDraftSnapshotSource = {
  title?: string,
  description?: string | null,
  patientId?: string | null,
  assigneeIds?: string[] | null,
  assigneeTeamId?: string | null,
  dueDate?: Date | null,
  priority?: string | null,
  estimatedTime?: number | null,
  done?: boolean,
}

export function serializeTaskCreateDraft(values: TaskCreateDraftSnapshotSource): string {
  return JSON.stringify({
    title: values.title,
    description: values.description ?? '',
    patientId: values.patientId || '',
    assigneeIds: [...(values.assigneeIds ?? [])].sort(),
    assigneeTeamId: values.assigneeTeamId ?? null,
    dueDate: values.dueDate ? values.dueDate.getTime() : null,
    priority: values.priority ?? null,
    estimatedTime: values.estimatedTime ?? null,
    done: values.done,
  })
}
