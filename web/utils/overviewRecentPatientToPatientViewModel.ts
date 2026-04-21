import type { PatientViewModel } from '@/components/tables/PatientList'
import type { GetOverviewDataQuery, TaskType } from '@/api/gql/generated'
import { PatientState } from '@/api/gql/generated'

type OverviewRecentPatient = GetOverviewDataQuery['recentPatients'][0]

const ADMITTED_OR_WAITING: PatientState[] = [PatientState.Admitted, PatientState.Wait]

export function overviewRecentPatientToPatientViewModel(p: OverviewRecentPatient): PatientViewModel {
  const tasks = (p.tasks ?? []) as TaskType[]
  const countForAggregate = ADMITTED_OR_WAITING.includes(p.state)
  return {
    id: p.id,
    name: p.name,
    firstname: p.firstname,
    lastname: p.lastname,
    birthdate: new Date(p.birthdate),
    sex: p.sex,
    state: p.state,
    clinic: null,
    position: p.position as PatientViewModel['position'],
    openTasksCount: countForAggregate ? tasks.filter(t => !t.done).length : 0,
    closedTasksCount: countForAggregate ? tasks.filter(t => t.done).length : 0,
    tasks,
    properties: p.properties ?? [],
  }
}
