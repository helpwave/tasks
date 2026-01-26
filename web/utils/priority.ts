import type { TaskPriority } from '@/api/gql/generated'

function toBackgroundColor(priority: TaskPriority | null | undefined): string {
  switch (priority) {
  case 'P1':
    return 'bg-priority-p1'
  case 'P2':
    return 'bg-priority-p2'
  case 'P3':
    return 'bg-priority-p3'
  case 'P4':
    return 'bg-priority-p4'
  default:
    return ''
  }
}

function toCheckboxColor(priority: TaskPriority | null | undefined): string {
  switch (priority) {
  case 'P1':
    return 'border-priority-p1 text-priority-p1 data-[checked=true]:bg-priority-p1/30 data-[checked=false]:bg-priority-p1/10'
  case 'P2':
    return 'border-priority-p2 text-priority-p2 data-[checked=true]:bg-priority-p2/30 data-[checked=false]:bg-priority-p2/10'
  case 'P3':
    return 'border-priority-p3 text-priority-p3 data-[checked=true]:bg-priority-p3/30 data-[checked=false]:bg-priority-p3/10'
  case 'P4':
    return 'border-priority-p4 text-priority-p4 data-[checked=true]:bg-priority-p4/30 data-[checked=false]:bg-priority-p4/10'
  default:
    return ''
  }
}

export const PriorityUtils = {
  toBackgroundColor,
  toCheckboxColor,
}