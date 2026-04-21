import type { ColumnFilter, ColumnFiltersState } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/table-core'
import type { FilterOperator, FilterValue } from '@helpwave/hightide'
import type { TaskViewModel } from '@/components/tables/TaskList'
import type { PatientViewModel } from '@/components/tables/PatientList'

function normalizeLower(s: string | undefined | null): string {
  return (s ?? '').toLowerCase()
}

function calendarDateParts(d: Date): { y: number, m: number, day: number } {
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() }
}

function compareCalendarDate(a: Date, b: Date): number {
  const ca = calendarDateParts(a)
  const cb = calendarDateParts(b)
  if (ca.y !== cb.y) return ca.y - cb.y
  if (ca.m !== cb.m) return ca.m - cb.m
  return ca.day - cb.day
}

function taskPropertyText(task: TaskViewModel, definitionId: string): string {
  const prop = task.properties?.find((p) => p.definition.id === definitionId)
  return prop?.textValue ?? ''
}

function patientPropertyText(patient: PatientViewModel, definitionId: string): string {
  const prop = patient.properties?.find((p) => p.definition.id === definitionId)
  return prop?.textValue ?? ''
}

function matchesTextOperator(
  haystack: string,
  operator: FilterOperator,
  needle: string
): boolean {
  const h = normalizeLower(haystack)
  const n = normalizeLower(needle)
  switch (operator) {
  case 'contains':
    return h.includes(n)
  case 'notContains':
    return !h.includes(n)
  case 'equals':
    return h === n
  case 'notEquals':
    return h !== n
  case 'startsWith':
    return h.startsWith(n)
  case 'endsWith':
    return h.endsWith(n)
  case 'isUndefined':
    return haystack === ''
  case 'isNotUndefined':
    return haystack !== ''
  default:
    return true
  }
}

function matchesNumberOperator(
  value: number | undefined,
  operator: FilterOperator,
  p: FilterValue['parameter']
): boolean {
  const v = value
  const eq = p.numberValue
  const min = p.numberMin
  const max = p.numberMax
  switch (operator) {
  case 'equals':
    return v != null && eq != null && v === eq
  case 'notEquals':
    return v == null || eq == null || v !== eq
  case 'greaterThan':
    return v != null && eq != null && v > eq
  case 'greaterThanOrEqual':
    return v != null && eq != null && v >= eq
  case 'lessThan':
    return v != null && eq != null && v < eq
  case 'lessThanOrEqual':
    return v != null && eq != null && v <= eq
  case 'between':
    return v != null && min != null && max != null && v >= min && v <= max
  case 'notBetween':
    return v == null || min == null || max == null || v < min || v > max
  case 'isUndefined':
    return v == null
  case 'isNotUndefined':
    return v != null
  default:
    return true
  }
}

function matchesDateOperator(
  value: Date | undefined,
  operator: FilterOperator,
  fv: FilterValue
): boolean {
  const p = fv.parameter
  if (operator === 'isUndefined') return value == null
  if (operator === 'isNotUndefined') return value != null
  if (value == null) return false
  const cmp = p.dateValue
  const dmin = p.dateMin
  const dmax = p.dateMax
  if (fv.dataType === 'dateTime') {
    const t = value.getTime()
    switch (operator) {
    case 'equals':
      return cmp != null && Math.abs(t - cmp.getTime()) < 60000
    case 'notEquals':
      return cmp == null || Math.abs(t - cmp.getTime()) >= 60000
    case 'greaterThan':
      return cmp != null && t > cmp.getTime()
    case 'greaterThanOrEqual':
      return cmp != null && t >= cmp.getTime()
    case 'lessThan':
      return cmp != null && t < cmp.getTime()
    case 'lessThanOrEqual':
      return cmp != null && t <= cmp.getTime()
    case 'between':
      return dmin != null && dmax != null && t >= dmin.getTime() && t <= dmax.getTime()
    case 'notBetween':
      return dmin == null || dmax == null || t < dmin.getTime() || t > dmax.getTime()
    default:
      return true
    }
  }
  switch (operator) {
  case 'equals':
    return cmp != null && compareCalendarDate(value, cmp) === 0
  case 'notEquals':
    return cmp == null || compareCalendarDate(value, cmp) !== 0
  case 'greaterThan':
    return cmp != null && compareCalendarDate(value, cmp) > 0
  case 'greaterThanOrEqual':
    return cmp != null && compareCalendarDate(value, cmp) >= 0
  case 'lessThan':
    return cmp != null && compareCalendarDate(value, cmp) < 0
  case 'lessThanOrEqual':
    return cmp != null && compareCalendarDate(value, cmp) <= 0
  case 'between':
    return dmin != null && dmax != null
        && compareCalendarDate(value, dmin) >= 0 && compareCalendarDate(value, dmax) <= 0
  case 'notBetween':
    return dmin == null || dmax == null
        || compareCalendarDate(value, dmin) < 0 || compareCalendarDate(value, dmax) > 0
  default:
    return true
  }
}

function matchesBooleanOperator(done: boolean, operator: FilterOperator): boolean {
  if (operator === 'isTrue') return done === true
  if (operator === 'isFalse') return done === false
  return true
}

function matchesSingleTagOperator(
  value: string | undefined,
  operator: FilterOperator,
  fv: FilterValue
): boolean {
  const p = fv.parameter
  const tags = (p as { uuidValues?: unknown[], stringValue?: string }).uuidValues as string[] | undefined
  const single = p.stringValue ?? (tags?.length === 1 ? tags[0] : undefined)
  const v = value ?? ''
  switch (operator) {
  case 'equals':
    return v === single
  case 'notEquals':
    return v !== single
  case 'contains':
    return tags != null && tags.includes(v)
  case 'notContains':
    return tags == null || !tags.includes(v)
  case 'isUndefined':
    return v === ''
  case 'isNotUndefined':
    return v !== ''
  default:
    return true
  }
}

function taskMatchesColumnFilter(task: TaskViewModel, filter: ColumnFilter): boolean {
  const value = filter.value as FilterValue | undefined
  if (!value?.operator || !value.parameter || !value.dataType) return true
  const id = filter.id
  const op = value.operator
  const fv = value

  if (id === 'done') {
    return matchesBooleanOperator(task.done, op)
  }
  if (id === 'title' || id === 'name') {
    return matchesTextOperator(task.name, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'description') {
    return matchesTextOperator(task.description ?? '', op, fv.parameter.stringValue ?? '')
  }
  if (id === 'dueDate') {
    return matchesDateOperator(task.dueDate, op, fv)
  }
  if (id === 'priority') {
    return matchesSingleTagOperator(task.priority ?? undefined, op, fv)
  }
  if (id === 'patient') {
    return matchesTextOperator(task.patient?.name ?? '', op, fv.parameter.stringValue ?? '')
  }
  if (id === 'assignee') {
    const label = task.assignee?.name ?? task.assigneeTeam?.title ?? ''
    return matchesTextOperator(label, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'assigneeTeam') {
    return matchesTextOperator(task.assigneeTeam?.title ?? '', op, fv.parameter.stringValue ?? '')
  }
  if (id === 'updated' || id === 'updateDate') {
    return matchesDateOperator(task.updateDate, op, fv)
  }
  if (id === 'creationDate') {
    return matchesDateOperator(task.updateDate, op, fv)
  }
  if (id === 'estimatedTime') {
    return matchesNumberOperator(task.estimatedTime ?? undefined, op, fv.parameter)
  }
  if (id.startsWith('property_')) {
    const defId = id.replace(/^property_/, '')
    return matchesTextOperator(taskPropertyText(task, defId), op, fv.parameter.stringValue ?? '')
  }
  return true
}

function patientMatchesColumnFilter(patient: PatientViewModel, filter: ColumnFilter): boolean {
  const value = filter.value as FilterValue | undefined
  if (!value?.operator || !value.parameter || !value.dataType) return true
  const id = filter.id === 'locationSubtree' ? 'position' : filter.id
  const op = value.operator
  const fv = value

  if (id === 'name') {
    return matchesTextOperator(patient.name, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'state') {
    const p = fv.parameter
    const raw = p.uuidValues?.length ? p.uuidValues : p.stringValue ? [p.stringValue] : []
    const tags = raw.map(String)
    if (tags.length === 0) return true
    return tags.includes(patient.state)
  }
  if (id === 'sex') {
    return matchesSingleTagOperator(patient.sex, op, fv)
  }
  if (id === 'birthdate') {
    return matchesDateOperator(patient.birthdate, op, fv)
  }
  if (id === 'position' || id === 'locationSubtree') {
    const want = fv.parameter.uuidValue != null && String(fv.parameter.uuidValue) !== ''
      ? String(fv.parameter.uuidValue)
      : null
    const multi = fv.parameter.uuidValues as string[] | undefined
    if (multi && multi.length > 0) {
      const posId = patient.position?.id
      return posId != null && multi.includes(posId)
    }
    if (want && patient.position?.id) {
      return patient.position.id === want
    }
    return matchesTextOperator(patient.position?.title ?? '', op, fv.parameter.stringValue ?? '')
  }
  if (id === 'clinic') {
    return matchesTextOperator(patient.clinic?.title ?? '', op, fv.parameter.stringValue ?? '')
  }
  if (id === 'tasks') {
    const open = patient.openTasksCount
    const closed = patient.closedTasksCount
    const total = open + closed
    return matchesNumberOperator(total, op, fv.parameter)
  }
  if (id.startsWith('property_')) {
    const defId = id.replace(/^property_/, '')
    return matchesTextOperator(patientPropertyText(patient, defId), op, fv.parameter.stringValue ?? '')
  }
  return true
}

function taskMatchesSearch(task: TaskViewModel, q: string): boolean {
  const lower = q.trim().toLowerCase()
  if (!lower) return true
  if (task.name.toLowerCase().includes(lower)) return true
  if ((task.description ?? '').toLowerCase().includes(lower)) return true
  if ((task.patient?.name ?? '').toLowerCase().includes(lower)) return true
  return false
}

function patientMatchesSearch(patient: PatientViewModel, q: string): boolean {
  const lower = q.trim().toLowerCase()
  if (!lower) return true
  if (patient.name.toLowerCase().includes(lower)) return true
  if (patient.firstname.toLowerCase().includes(lower)) return true
  if (patient.lastname.toLowerCase().includes(lower)) return true
  return false
}

function compareTaskBySortId(
  a: TaskViewModel,
  b: TaskViewModel,
  sortId: string,
  desc: boolean
): number {
  const dir = desc ? -1 : 1
  const cmp = (x: number) => x * dir

  if (sortId === 'done') {
    if (a.done === b.done) return 0
    return cmp(a.done ? 1 : -1)
  }
  if (sortId === 'title' || sortId === 'name') {
    return cmp(a.name.localeCompare(b.name))
  }
  if (sortId === 'description') {
    return cmp((a.description ?? '').localeCompare(b.description ?? ''))
  }
  if (sortId === 'dueDate') {
    const ta = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY
    const tb = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'priority') {
    return cmp((a.priority ?? '').localeCompare(b.priority ?? ''))
  }
  if (sortId === 'patient') {
    return cmp((a.patient?.name ?? '').localeCompare(b.patient?.name ?? ''))
  }
  if (sortId === 'assignee') {
    const la = a.assignee?.name ?? a.assigneeTeam?.title ?? ''
    const lb = b.assignee?.name ?? b.assigneeTeam?.title ?? ''
    return cmp(la.localeCompare(lb))
  }
  if (sortId === 'assigneeTeam') {
    return cmp((a.assigneeTeam?.title ?? '').localeCompare(b.assigneeTeam?.title ?? ''))
  }
  if (sortId === 'updated' || sortId === 'updateDate') {
    const ta = a.updateDate.getTime()
    const tb = b.updateDate.getTime()
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'creationDate') {
    const ta = a.updateDate.getTime()
    const tb = b.updateDate.getTime()
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'estimatedTime') {
    const ea = a.estimatedTime ?? -1
    const eb = b.estimatedTime ?? -1
    if (ea === eb) return 0
    return cmp(ea < eb ? -1 : 1)
  }
  if (sortId.startsWith('property_')) {
    const defId = sortId.replace(/^property_/, '')
    return cmp(taskPropertyText(a, defId).localeCompare(taskPropertyText(b, defId)))
  }
  return 0
}

function sortTasksWithState(tasks: TaskViewModel[], sorting: SortingState): TaskViewModel[] {
  const rules = sorting.length > 0
    ? sorting
    : [
      { id: 'done', desc: false },
      { id: 'dueDate', desc: false },
    ]
  return [...tasks].sort((a, b) => {
    for (const s of rules) {
      const c = compareTaskBySortId(a, b, s.id, s.desc)
      if (c !== 0) return c
    }
    return a.id.localeCompare(b.id)
  })
}

function comparePatientBySortId(
  a: PatientViewModel,
  b: PatientViewModel,
  sortId: string,
  desc: boolean
): number {
  const dir = desc ? -1 : 1
  const cmp = (x: number) => x * dir

  if (sortId === 'name') {
    const byLast = a.lastname.localeCompare(b.lastname)
    if (byLast !== 0) return cmp(byLast)
    return cmp(a.firstname.localeCompare(b.firstname))
  }
  if (sortId === 'state') {
    return cmp(a.state.localeCompare(b.state))
  }
  if (sortId === 'sex') {
    return cmp(a.sex.localeCompare(b.sex))
  }
  if (sortId === 'birthdate') {
    const ta = a.birthdate.getTime()
    const tb = b.birthdate.getTime()
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'position') {
    return cmp((a.position?.title ?? '').localeCompare(b.position?.title ?? ''))
  }
  if (sortId === 'clinic') {
    return cmp((a.clinic?.title ?? '').localeCompare(b.clinic?.title ?? ''))
  }
  if (sortId === 'tasks') {
    const ta = a.openTasksCount + a.closedTasksCount
    const tb = b.openTasksCount + b.closedTasksCount
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'updateDate') {
    return cmp(a.name.localeCompare(b.name))
  }
  if (sortId.startsWith('property_')) {
    const defId = sortId.replace(/^property_/, '')
    return cmp(patientPropertyText(a, defId).localeCompare(patientPropertyText(b, defId)))
  }
  return 0
}

function sortPatientsWithState(patients: PatientViewModel[], sorting: SortingState): PatientViewModel[] {
  const rules = sorting.length > 0 ? sorting : [{ id: 'name', desc: false }]
  return [...patients].sort((a, b) => {
    for (const s of rules) {
      const c = comparePatientBySortId(a, b, s.id, s.desc)
      if (c !== 0) return c
    }
    return a.id.localeCompare(b.id)
  })
}

export function applyVirtualDerivedTasks(
  tasks: TaskViewModel[],
  filters: ColumnFiltersState,
  sorting: SortingState,
  searchQuery: string
): TaskViewModel[] {
  let out = tasks.filter((t) => taskMatchesSearch(t, searchQuery))
  for (const f of filters) {
    out = out.filter((t) => taskMatchesColumnFilter(t, f))
  }
  return sortTasksWithState(out, sorting)
}

export function applyVirtualDerivedPatients(
  patients: PatientViewModel[],
  filters: ColumnFiltersState,
  sorting: SortingState,
  searchQuery: string
): PatientViewModel[] {
  let out = patients.filter((p) => patientMatchesSearch(p, searchQuery))
  for (const f of filters) {
    out = out.filter((p) => patientMatchesColumnFilter(p, f))
  }
  return sortPatientsWithState(out, sorting)
}

