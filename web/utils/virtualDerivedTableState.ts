import type { ColumnFilter, ColumnFiltersState } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/table-core'
import type { FilterOperator, FilterValue } from '@helpwave/hightide'
import type { TaskViewModel } from '@/components/tables/TaskList'
import type { PatientViewModel } from '@/components/tables/PatientList'
import { getLocationNodesByKind, type LocationKindColumn } from '@/utils/location'

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

// Selected tags of a singleTag/multiTag filter can be stored under several
// parameter fields depending on how the filter UI serialized them. Mirror the
// extraction used when building API filter clauses (see tableStateToApi.ts) so
// the in-memory matcher considers the same values.
function extractSelectedTags(parameter: FilterValue['parameter']): string[] {
  const p = parameter as Record<string, unknown>
  for (const field of ['uuidValues', 'searchTags', 'searchTagsContains']) {
    const v = p[field]
    if (Array.isArray(v) && v.length > 0) return v.map(String)
  }
  if (parameter.uuidValue != null && String(parameter.uuidValue) !== '') {
    return [String(parameter.uuidValue)]
  }
  if (p['searchTag'] != null) return [String(p['searchTag'])]
  if (parameter.stringValue) return [String(parameter.stringValue)]
  return []
}

function matchesSingleTagOperator(
  value: string | undefined,
  operator: FilterOperator,
  fv: FilterValue
): boolean {
  const tags = extractSelectedTags(fv.parameter)
  // "equals"/"notEquals" use a single selection: the tag popup stores it in
  // uuidValue (extracted above), legacy filters in stringValue.
  const single = tags.length === 1 ? tags[0] : fv.parameter.stringValue
  const v = value ?? ''
  switch (operator) {
  case 'equals':
    return single == null || v === single
  case 'notEquals':
    return single == null || v !== single
  case 'contains':
    return tags.length === 0 || tags.includes(v)
  case 'notContains':
    return tags.length === 0 || !tags.includes(v)
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
    // the assignee filter popup selects users by id (uuidValue/uuidValues)
    const p = fv.parameter
    const selectedIds = Array.isArray(p.uuidValues) && p.uuidValues.length > 0
      ? p.uuidValues.map(String)
      : p.uuidValue != null && String(p.uuidValue) !== ''
        ? [String(p.uuidValue)]
        : []
    if (selectedIds.length > 0) {
      const assigneeId = task.assignee?.id ?? (task.assigneeTeam ? `team:${task.assigneeTeam.id}` : undefined)
      const matches = assigneeId != null && selectedIds.includes(assigneeId)
      return op === 'notEquals' || op === 'notContains' ? !matches : matches
    }
    if (op === 'isUndefined') return task.assignee == null && task.assigneeTeam == null
    if (op === 'isNotUndefined') return task.assignee != null || task.assigneeTeam != null
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
  if (id === 'firstname') {
    return matchesTextOperator(patient.firstname, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'lastname') {
    return matchesTextOperator(patient.lastname, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'state') {
    return matchesSingleTagOperator(String(patient.state ?? ''), op, fv)
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
  if (id === 'location-WARD' || id === 'location-ROOM' || id === 'location-BED') {
    const kind = id.replace('location-', '') as LocationKindColumn
    const title = getLocationNodesByKind(patient.position ?? null)[kind]?.title ?? ''
    return matchesTextOperator(title, op, fv.parameter.stringValue ?? '')
  }
  if (id === 'tasks') {
    const open = patient.openTasksCount
    const closed = patient.closedTasksCount
    const total = open + closed
    return matchesNumberOperator(total, op, fv.parameter)
  }
  if (id === 'updateDate') {
    return matchesDateOperator(patient.updateDate, op, fv)
  }
  if (id === 'stateUpdateDate') {
    return matchesDateOperator(patient.stateUpdateDate, op, fv)
  }
  if (id === 'clinicUpdateDate') {
    return matchesDateOperator(patient.clinicUpdateDate, op, fv)
  }
  if (id === 'positionUpdateDate') {
    return matchesDateOperator(patient.positionUpdateDate, op, fv)
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
    // backend parity: ascending puts tasks without a due date first,
    // descending puts them last (asc().nulls_first() / desc().nulls_last())
    const ta = a.dueDate?.getTime()
    const tb = b.dueDate?.getTime()
    if (ta == null && tb == null) return 0
    if (ta == null) return -dir
    if (tb == null) return dir
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'priority') {
    // backend parity: P1 < P2 < P3 < P4, tasks without a priority rank
    // behind P4 (the direction flips that ordering as a whole)
    const order = (p: string | null | undefined): number => {
      const idx = ['P1', 'P2', 'P3', 'P4'].indexOf(p ?? '')
      return idx === -1 ? 99 : idx + 1
    }
    const pa = order(a.priority)
    const pb = order(b.priority)
    if (pa === pb) return 0
    return cmp(pa < pb ? -1 : 1)
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
  if (sortId === 'firstname') {
    return cmp(a.firstname.localeCompare(b.firstname))
  }
  if (sortId === 'lastname') {
    return cmp(a.lastname.localeCompare(b.lastname))
  }
  if (sortId === 'state') {
    // backend parity: WAIT < ADMITTED < DISCHARGED < DEAD
    const order = (s: string): number => {
      const idx = ['WAIT', 'ADMITTED', 'DISCHARGED', 'DEAD'].indexOf(s)
      return idx === -1 ? 4 : idx
    }
    const sa = order(String(a.state))
    const sb = order(String(b.state))
    if (sa === sb) return 0
    return cmp(sa < sb ? -1 : 1)
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
  if (sortId === 'updated' || sortId === 'updateDate') {
    // backend parity: sort by the update date itself; patients without one
    // come first ascending, last descending
    const ta = a.updateDate?.getTime()
    const tb = b.updateDate?.getTime()
    if (ta == null && tb == null) return 0
    if (ta == null) return -dir
    if (tb == null) return dir
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
  }
  if (sortId === 'location-WARD' || sortId === 'location-ROOM' || sortId === 'location-BED') {
    const kind = sortId.replace('location-', '') as LocationKindColumn
    const la = getLocationNodesByKind(a.position ?? null)[kind]?.title ?? ''
    const lb = getLocationNodesByKind(b.position ?? null)[kind]?.title ?? ''
    return cmp(la.localeCompare(lb))
  }
  if (sortId === 'stateUpdateDate' || sortId === 'clinicUpdateDate' || sortId === 'positionUpdateDate') {
    const ta = a[sortId]?.getTime() ?? Number.POSITIVE_INFINITY
    const tb = b[sortId]?.getTime() ?? Number.POSITIVE_INFINITY
    if (ta === tb) return 0
    return cmp(ta < tb ? -1 : 1)
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

