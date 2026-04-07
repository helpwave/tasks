import type { TaskViewModel } from '@/components/tables/TaskList'
import type { GetOverviewDataQuery } from '@/api/gql/generated'

type OverviewRecentTask = GetOverviewDataQuery['recentTasks'][0]

export function overviewRecentTaskToTaskViewModel(task: OverviewRecentTask): TaskViewModel {
  return {
    id: task.id,
    name: task.title,
    description: task.description ?? undefined,
    updateDate: task.updateDate ? new Date(task.updateDate) : new Date(task.creationDate),
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    priority: task.priority ?? null,
    estimatedTime: task.estimatedTime ?? null,
    done: task.done,
    patient: task.patient
      ? {
        id: task.patient.id,
        name: task.patient.name,
        locations: task.patient.position
          ? [{
            id: task.patient.position.id,
            title: task.patient.position.title,
            parent: task.patient.position.parent
              ? {
                id: task.patient.position.parent.id,
                title: task.patient.position.parent.title,
                parent: null,
              }
              : undefined,
          }]
          : [],
      }
      : undefined,
    assignee: task.assignees[0]
      ? {
        id: task.assignees[0].id,
        name: task.assignees[0].name,
        avatarURL: task.assignees[0].avatarUrl,
        isOnline: task.assignees[0].isOnline ?? null,
      }
      : undefined,
    assigneeTeam: task.assigneeTeam
      ? { id: task.assigneeTeam.id, title: task.assigneeTeam.title }
      : undefined,
    additionalAssigneeCount:
      !task.assigneeTeam && task.assignees.length > 1 ? task.assignees.length - 1 : 0,
    sourceTaskPresetId: task.sourceTaskPresetId ?? null,
    properties: task.properties ?? [],
  }
}
