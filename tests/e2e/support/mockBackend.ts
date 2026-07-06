import type { Page, Route } from '@playwright/test'
import type { FilterClause, SearchInput, SortClause } from './queryEngine'
import { applyOp, orderBy, paginate } from './queryEngine'

/**
 * Deterministic mock of the GraphQL backend + OIDC session for the web app.
 *
 * These e2e tests run the *real* Next.js dev server (real React, real Apollo
 * data layer) but stub the network boundary so the data-loading behaviour can
 * be exercised reproducibly without a backend, Keycloak, or seeded database
 * (which are not reachable in CI / sandboxed environments).
 *
 * The defaults below match `web/utils/config.ts` when no RUNTIME_* env vars are
 * present (GraphQL at :8000, issuer at :8080, client id `tasks-web`).
 */

const ISSUER = 'http://localhost:8080/realms/tasks'
const CLIENT_ID = 'tasks-web'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

export type PropertyDefinition = {
  id: string,
  name: string,
  fieldType: string,
  options: string[],
}

export type PatientFixture = {
  id: string,
  firstname: string,
  lastname: string,
  state?: string,
  sex?: string,
  birthdate?: string,
  updateDate?: string | null,
  properties?: Array<{ id: string, definitionId: string, textValue?: string | null }>,
}

export type TaskFixture = {
  id: string,
  title: string,
  description?: string | null,
  done?: boolean,
  dueDate?: string | null,
  priority?: string | null,
  estimatedTime?: number | null,
  creationDate?: string,
  updateDate?: string | null,
  // reference into MockOptions.patients (or absent for "no patient")
  patientId?: string | null,
  assigneeIds?: string[],
}

export type SavedViewFixture = {
  id: string,
  name: string,
  baseEntityType: 'PATIENT' | 'TASK',
  filterDefinition: string,
  sortDefinition: string,
  parameters: string,
  relatedFilterDefinition?: string,
  relatedSortDefinition?: string,
  relatedParameters?: string,
  isOwner?: boolean,
}

export type MockOptions = {
  patients: PatientFixture[],
  tasks?: TaskFixture[],
  savedViews?: SavedViewFixture[],
  users?: Array<{ id: string, name: string }>,
  propertyDefinitions?: PropertyDefinition[],
  // root locations the user has access to (drives the location picker prompt)
  rootLocations?: Array<{ id: string, title: string, kind: string }>,
  // Override the GetLocations response. Defaults to `rootLocations`. Passing an
  // empty array keeps the user's selection empty on first load, which forces the
  // mandatory root-location prompt to appear.
  locationNodes?: Array<{ id: string, title: string, kind: string, parentId: string | null }>,
  // artificial latency (ms) added to the GetPatients query, to exercise the
  // loading -> data transition without an empty flash
  patientsDelayMs?: number,
  // artificial latency (ms) added to the GetLocations query. Delaying it keeps
  // the user's selection empty long enough that the mandatory root-location
  // prompt opens, which is the scenario where the duplicate-dialog bug appeared.
  locationsDelayMs?: number,
}

export type MockHandle = {
  // operations the client sent, in order: { name, variables }
  operations: Array<{ name: string, variables: Record<string, unknown> }>,
  // mutations captured for assertions
  mutations: Array<{ name: string, variables: Record<string, unknown> }>,
}

/**
 * Seed a non-expired OIDC user into localStorage so `restoreSession()` resolves
 * an authenticated identity without any redirect to Keycloak.
 */
export async function seedAuth(page: Page): Promise<void> {
  const user = {
    id_token: 'mock-id-token',
    session_state: null,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    scope: 'openid profile email organization',
    profile: { sub: 'user-1', name: 'Test User', email: 'test@example.com' },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
  const key = `oidc.user:${ISSUER}:${CLIENT_ID}`
  await page.addInitScript(
    ([storageKey, value]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    },
    [key, user] as const
  )
}

function buildProperty(def: PropertyDefinition, value: { id: string, textValue?: string | null }) {
  return {
    __typename: 'PropertyValueType',
    id: value.id,
    definition: {
      __typename: 'PropertyDefinitionType',
      id: def.id,
      name: def.name,
      description: null,
      fieldType: def.fieldType,
      isActive: true,
      allowedEntities: ['PATIENT'],
      options: def.options,
    },
    textValue: value.textValue ?? null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    dateTimeValue: null,
    selectValue: null,
    multiSelectValues: null,
    userValue: null,
    user: null,
    team: null,
  }
}

function fullPatient(p: PatientFixture, defs: PropertyDefinition[]) {
  const defById = new Map(defs.map(d => [d.id, d]))
  const properties = (p.properties ?? [])
    .map(v => {
      const def = defById.get(v.definitionId)
      return def ? buildProperty(def, v) : null
    })
    .filter(Boolean)
  return {
    __typename: 'PatientType',
    id: p.id,
    name: `${p.lastname}, ${p.firstname}`,
    firstname: p.firstname,
    lastname: p.lastname,
    birthdate: p.birthdate ?? '1990-01-01',
    sex: p.sex ?? 'FEMALE',
    state: p.state ?? 'ADMITTED',
    updateDate: p.updateDate ?? null,
    stateUpdateDate: null,
    clinicUpdateDate: null,
    positionUpdateDate: null,
    description: '',
    checksum: 'chk-1',
    assignedLocation: null,
    assignedLocations: [],
    clinic: null,
    position: null,
    teams: [],
    tasks: [],
    properties,
  }
}

// ---------------------------------------------------------------------------
// queryable-field metadata (mirrors backend/api/query/adapters + metadata_service)
// ---------------------------------------------------------------------------

const STR_OPS = ['EQ', 'NEQ', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL']
const NUM_OPS = ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN', 'NOT_BETWEEN', 'IS_NULL', 'IS_NOT_NULL']
const DATE_OPS = NUM_OPS
const BOOL_OPS = ['EQ', 'IS_NULL', 'IS_NOT_NULL']
const CHOICE_OPS = ['EQ', 'NEQ', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL']
const REF_OPS = ['EQ', 'IN', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL', 'IS_NOT_NULL']

type QueryableFieldShape = {
  key: string,
  label: string,
  kind: string,
  valueType: string,
  allowedOperators: string[],
  sortable: boolean,
  searchable: boolean,
  propertyDefinitionId?: string | null,
  relation?: { targetEntity: string, idFieldKey: string, labelFieldKey: string, allowedFilterModes: string[] } | null,
  choice?: { optionKeys: string[], optionLabels: string[] } | null,
}

function queryableField(f: QueryableFieldShape) {
  return {
    __typename: 'QueryableField',
    ...f,
    propertyDefinitionId: f.propertyDefinitionId ?? null,
    relation: f.relation ? { __typename: 'QueryableRelationMeta', ...f.relation } : null,
    choice: f.choice ? { __typename: 'QueryableChoiceMeta', ...f.choice } : null,
    sortDirections: f.sortable ? ['ASC', 'DESC'] : [],
    filterable: f.allowedOperators.length > 0,
  }
}

function propertyQueryableFields(defs: PropertyDefinition[]) {
  return defs.map((d) => queryableField({
    key: `property_${d.id}`,
    label: d.name,
    kind: d.fieldType === 'FIELD_TYPE_SELECT' ? 'CHOICE' : 'PROPERTY',
    valueType: d.fieldType === 'FIELD_TYPE_NUMBER' ? 'NUMBER' : 'STRING',
    allowedOperators: d.fieldType === 'FIELD_TYPE_SELECT' ? CHOICE_OPS : STR_OPS,
    sortable: true,
    searchable: d.fieldType === 'FIELD_TYPE_TEXT',
    propertyDefinitionId: d.id,
    choice: d.fieldType === 'FIELD_TYPE_SELECT'
      ? { optionKeys: d.options, optionLabels: d.options }
      : null,
  }))
}

function patientQueryableFields(defs: PropertyDefinition[]) {
  return [
    queryableField({ key: 'name', label: 'Name', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({ key: 'firstname', label: 'First name', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({ key: 'lastname', label: 'Last name', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({
      key: 'state', label: 'State', kind: 'CHOICE', valueType: 'STRING', allowedOperators: CHOICE_OPS, sortable: true, searchable: false,
      choice: { optionKeys: ['WAIT', 'ADMITTED', 'DISCHARGED', 'DEAD'], optionLabels: ['WAIT', 'ADMITTED', 'DISCHARGED', 'DEAD'] },
    }),
    queryableField({
      key: 'sex', label: 'Sex', kind: 'CHOICE', valueType: 'STRING', allowedOperators: CHOICE_OPS, sortable: true, searchable: false,
      choice: { optionKeys: ['MALE', 'FEMALE', 'UNKNOWN'], optionLabels: ['Male', 'Female', 'Unknown'] },
    }),
    queryableField({ key: 'birthdate', label: 'Birthdate', kind: 'SCALAR', valueType: 'DATE', allowedOperators: DATE_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'updateDate', label: 'Update date', kind: 'SCALAR', valueType: 'DATETIME', allowedOperators: DATE_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'description', label: 'Description', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({ key: 'clinic', label: 'Clinic', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: false }),
    queryableField({
      key: 'position', label: 'Location', kind: 'REFERENCE', valueType: 'UUID', allowedOperators: REF_OPS, sortable: true, searchable: false,
      relation: { targetEntity: 'LocationNode', idFieldKey: 'id', labelFieldKey: 'title', allowedFilterModes: ['ID', 'LABEL'] },
    }),
    queryableField({ key: 'location-WARD', label: 'Ward', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'location-ROOM', label: 'Room', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'location-BED', label: 'Bed', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: false }),
    ...propertyQueryableFields(defs),
  ]
}

function taskQueryableFields() {
  return [
    queryableField({ key: 'title', label: 'Title', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({ key: 'description', label: 'Description', kind: 'SCALAR', valueType: 'STRING', allowedOperators: STR_OPS, sortable: true, searchable: true }),
    queryableField({ key: 'done', label: 'Done', kind: 'SCALAR', valueType: 'BOOLEAN', allowedOperators: BOOL_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'dueDate', label: 'Due date', kind: 'SCALAR', valueType: 'DATETIME', allowedOperators: DATE_OPS, sortable: true, searchable: false }),
    queryableField({
      key: 'priority', label: 'Priority', kind: 'CHOICE', valueType: 'STRING',
      allowedOperators: CHOICE_OPS, sortable: true, searchable: false,
      choice: { optionKeys: ['P1', 'P2', 'P3', 'P4'], optionLabels: ['P1', 'P2', 'P3', 'P4'] },
    }),
    queryableField({ key: 'estimatedTime', label: 'Estimated time', kind: 'SCALAR', valueType: 'NUMBER', allowedOperators: NUM_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'creationDate', label: 'Creation date', kind: 'SCALAR', valueType: 'DATETIME', allowedOperators: DATE_OPS, sortable: true, searchable: false }),
    queryableField({ key: 'updateDate', label: 'Update date', kind: 'SCALAR', valueType: 'DATETIME', allowedOperators: DATE_OPS, sortable: true, searchable: false }),
    queryableField({
      key: 'patient', label: 'Patient', kind: 'REFERENCE', valueType: 'UUID', allowedOperators: REF_OPS, sortable: true, searchable: true,
      relation: { targetEntity: 'Patient', idFieldKey: 'id', labelFieldKey: 'name', allowedFilterModes: ['ID', 'LABEL'] },
    }),
    queryableField({
      key: 'assignee', label: 'Assignee', kind: 'REFERENCE', valueType: 'UUID', allowedOperators: REF_OPS, sortable: true, searchable: true,
      relation: { targetEntity: 'User', idFieldKey: 'id', labelFieldKey: 'name', allowedFilterModes: ['ID', 'LABEL'] },
    }),
    queryableField({
      key: 'assigneeTeam', label: 'Assignee team', kind: 'REFERENCE', valueType: 'UUID', allowedOperators: REF_OPS, sortable: true, searchable: false,
      relation: { targetEntity: 'LocationNode', idFieldKey: 'id', labelFieldKey: 'title', allowedFilterModes: ['ID', 'LABEL'] },
    }),
  ]
}

// ---------------------------------------------------------------------------
// entity query execution (filters / search / sorts), mirroring the adapters
// ---------------------------------------------------------------------------

type FullPatient = ReturnType<typeof fullPatient>

/** Backend display name used for query semantics (`firstname lastname`). */
function patientQueryName(p: { firstname: string, lastname: string }): string {
  return `${p.firstname} ${p.lastname}`.trim()
}

function patientPropertyTextValue(p: FullPatient, defId: string): string | null {
  const prop = (p.properties as Array<{ definition: { id: string }, textValue?: string | null }>)
    .find(v => v.definition.id === defId)
  return prop?.textValue ?? null
}

function patientPassesFilter(p: FullPatient, clause: FilterClause): boolean {
  const { fieldKey: key, operator: op, value: val } = clause
  if (key.startsWith('property_')) {
    return applyOp(patientPropertyTextValue(p, key.replace('property_', '')), op, val)
  }
  switch (key) {
  case 'firstname': return applyOp(p.firstname, op, val)
  case 'lastname': return applyOp(p.lastname, op, val)
  case 'name': return applyOp(patientQueryName(p), op, val)
  case 'state': return applyOp(p.state, op, val)
  case 'sex': return applyOp(p.sex, op, val)
  case 'birthdate': return applyOp(p.birthdate, op, val, 'date')
  case 'description': return applyOp(p.description, op, val)
  case 'updateDate': return applyOp(p.updateDate, op, val, 'datetime')
  case 'clinic': return applyOp((p.clinic as { title?: string } | null)?.title ?? null, op, val)
  case 'position': return applyOp((p.position as { title?: string } | null)?.title ?? null, op, val)
  default: return true
  }
}

const PATIENT_STATE_ORDER: Record<string, number> = { WAIT: 0, ADMITTED: 1, DISCHARGED: 2, DEAD: 3 }
const TASK_PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 }

function patientSortAccessors(): Record<string, (p: FullPatient) => string | number | null | undefined> {
  const base: Record<string, (p: FullPatient) => string | number | null | undefined> = {
    'firstname': p => p.firstname,
    'lastname': p => p.lastname,
    // backend sorts `name` by lastname, then firstname
    'name': p => `${p.lastname} ${p.firstname}`,
    'state': p => PATIENT_STATE_ORDER[p.state] ?? 4,
    'sex': p => p.sex,
    'birthdate': p => p.birthdate,
    'description': p => p.description || null,
    'updateDate': p => p.updateDate ?? null,
    'clinic': p => (p.clinic as { title?: string } | null)?.title ?? null,
    'position': p => (p.position as { title?: string } | null)?.title ?? null,
  }
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop]
      if (typeof prop === 'string' && prop.startsWith('property_')) {
        const defId = prop.replace('property_', '')
        return (p: FullPatient) => patientPropertyTextValue(p, defId)
      }
      return undefined
    },
    has(target, prop: string) {
      return prop in target || (typeof prop === 'string' && prop.startsWith('property_'))
    },
  })
}

function patientMatchesSearch(p: FullPatient, search: SearchInput | null | undefined): boolean {
  const text = search?.searchText?.trim()
  if (!text) return true
  const q = text.toLowerCase()
  const parts = [p.firstname, p.lastname, patientQueryName(p), p.description]
  if (search?.includeProperties) {
    for (const prop of p.properties as Array<{ textValue?: string | null }>) {
      if (prop.textValue) parts.push(prop.textValue)
    }
  }
  return parts.some(v => (v ?? '').toLowerCase().includes(q))
}

export async function mockBackend(page: Page, options: MockOptions): Promise<MockHandle> {
  const defs = options.propertyDefinitions ?? []
  const rootLocations = options.rootLocations ?? [
    { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
  ]
  const handle: MockHandle = { operations: [], mutations: [] }

  // mutable patient store so optimistic edits + refetches stay consistent
  const patients = new Map(options.patients.map(p => [p.id, fullPatient(p, defs)]))

  const users = options.users ?? [{ id: 'user-1', name: 'Test User' }]
  const userById = new Map(users.map(u => [u.id, u]))
  const fullTask = (t: TaskFixture) => ({
    __typename: 'TaskType',
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    done: t.done ?? false,
    dueDate: t.dueDate ?? null,
    priority: t.priority ?? null,
    estimatedTime: t.estimatedTime ?? null,
    creationDate: t.creationDate ?? '2026-01-01T08:00:00Z',
    updateDate: t.updateDate ?? '2026-01-02T08:00:00Z',
    sourceTaskPresetId: null,
    patient: t.patientId ? (patients.get(t.patientId) ?? null) : null,
    assignees: (t.assigneeIds ?? []).map(id => ({
      __typename: 'UserType',
      id,
      name: userById.get(id)?.name ?? id,
      avatarUrl: null,
      lastOnline: null,
      isOnline: true,
    })),
    assigneeTeam: null,
    properties: [],
  })
  const tasks = new Map((options.tasks ?? []).map(t => [t.id, fullTask(t)]))

  // tasks embedded into a patient (GetPatients selection) — without the
  // back-reference to the patient, which would make the JSON cyclic
  const tasksOfPatient = (patientId: string) =>
    Array.from(tasks.values())
      .filter(t => t.patient?.id === patientId)
      .map(({ patient: _patient, ...rest }) => rest)

  type FullTask = ReturnType<typeof fullTask>
  const taskPassesFilter = (t: FullTask, clause: FilterClause): boolean => {
    const { fieldKey: key, operator: op, value: val } = clause
    switch (key) {
    case 'title': return applyOp(t.title, op, val)
    case 'description': return applyOp(t.description, op, val)
    case 'done': {
      if (op === 'EQ' && val?.boolValue != null) return t.done === val.boolValue
      if (op === 'IS_NULL') return t.done == null
      if (op === 'IS_NOT_NULL') return t.done != null
      return true
    }
    case 'dueDate': return applyOp(t.dueDate, op, val, 'datetime')
    case 'creationDate': return applyOp(t.creationDate, op, val, 'datetime')
    case 'updateDate': return applyOp(t.updateDate, op, val, 'datetime')
    case 'priority': return applyOp(t.priority, op, val)
    case 'estimatedTime': return applyOp(t.estimatedTime, op, val, 'number')
    case 'patient': {
      if (op === 'IS_NULL') return t.patient == null
      if (op === 'IS_NOT_NULL') return t.patient != null
      if ((op === 'EQ' || op === 'IN') && (val?.uuidValue || val?.uuidValues?.length)) {
        return applyOp(t.patient?.id ?? null, op, val)
      }
      if (op === 'CONTAINS' || op === 'STARTS_WITH' || op === 'ENDS_WITH') {
        if (!t.patient) return false
        return applyOp(patientQueryName(t.patient), op, val)
      }
      return true
    }
    case 'assignee': {
      if (op === 'IS_NULL') return t.assignees.length === 0
      if (op === 'IS_NOT_NULL') return t.assignees.length > 0
      if ((op === 'EQ' || op === 'IN') && (val?.uuidValue || val?.uuidValues?.length)) {
        const wanted = val?.uuidValue ? [val.uuidValue] : (val?.uuidValues ?? [])
        return t.assignees.some(a => wanted.includes(a.id))
      }
      if (op === 'CONTAINS' || op === 'STARTS_WITH' || op === 'ENDS_WITH') {
        return t.assignees.some(a => applyOp(a.name, op, val))
      }
      return true
    }
    default: return true
    }
  }

  const taskSortAccessors: Record<string, (t: FullTask) => string | number | null | undefined> = {
    'title': t => t.title,
    'description': t => t.description,
    'done': t => (t.done ? 1 : 0),
    'dueDate': t => t.dueDate,
    'priority': t => (t.priority != null ? TASK_PRIORITY_ORDER[t.priority] ?? 99 : 99),
    'estimatedTime': t => t.estimatedTime,
    'creationDate': t => t.creationDate,
    'updateDate': t => t.updateDate,
    'patient': t => (t.patient ? patientQueryName(t.patient) : null),
    'assignee': t => (t.assignees.length ? [...t.assignees].map(a => a.name).sort()[0] : null),
    'assigneeTeam': () => null,
  }

  const taskMatchesSearch = (t: FullTask, search: SearchInput | null | undefined): boolean => {
    const text = search?.searchText?.trim()
    if (!text) return true
    const q = text.toLowerCase()
    const parts = [t.title, t.description ?? '', t.patient ? patientQueryName(t.patient) : '', ...t.assignees.map(a => a.name)]
    return parts.some(v => (v ?? '').toLowerCase().includes(q))
  }

  // saved views store (custom views)
  let savedViewSeq = 0
  const savedViews = new Map(
    (options.savedViews ?? []).map(v => [v.id, {
      __typename: 'SavedView',
      relatedFilterDefinition: '',
      relatedSortDefinition: '',
      relatedParameters: '',
      ownerUserId: 'user-1',
      visibility: 'PRIVATE',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      isOwner: true,
      ...v,
    }])
  )

  const respond = (route: Route, body: unknown) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify(body),
    })

  await page.route('**/graphql', async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' })
    }

    let parsed: { operationName?: string, variables?: Record<string, unknown> } = {}
    try {
      parsed = JSON.parse(request.postData() ?? '{}')
    } catch {
      parsed = {}
    }
    const name = parsed.operationName ?? ''
    const variables = parsed.variables ?? {}
    handle.operations.push({ name, variables })

    const patientList = Array.from(patients.values())

    switch (name) {
    case 'GetGlobalData':
      return respond(route, {
        data: {
          me: {
            __typename: 'UserType',
            id: 'user-1',
            username: 'test',
            name: 'Test User',
            firstname: 'Test',
            lastname: 'User',
            avatarUrl: null,
            lastOnline: null,
            isOnline: true,
            organizations: null,
            rootLocations: rootLocations.map(l => ({ __typename: 'LocationNodeType', ...l })),
            tasks: [],
          },
          wards: [],
          teams: [],
          clinics: rootLocations.map(l => ({ __typename: 'LocationNodeType', id: l.id, title: l.title, parentId: null })),
          scopedPatientCounts: {
            __typename: 'ScopedPatientCounts',
            scopedPatientsTotal: patientList.length,
            scopedPatientsWaiting: patientList.filter(p => p.state === 'WAIT').length,
            scopedPatientsAdmitted: patientList.filter(p => p.state === 'ADMITTED').length,
            scopedPatientsDischarged: patientList.filter(p => p.state === 'DISCHARGED').length,
            scopedPatientsDeceased: patientList.filter(p => p.state === 'DEAD').length,
          },
        },
      })

    case 'GetLocations': {
      if (options.locationsDelayMs) {
        await new Promise(r => setTimeout(r, options.locationsDelayMs))
      }
      const nodes = options.locationNodes
        ?? rootLocations.map(l => ({ id: l.id, title: l.title, kind: l.kind, parentId: null }))
      return respond(route, {
        data: { locationNodes: nodes.map(n => ({ __typename: 'LocationNodeType', ...n })) },
      })
    }

    case 'GetPatients': {
      if (options.patientsDelayMs) {
        await new Promise(r => setTimeout(r, options.patientsDelayMs))
      }
      // Honour the `states`, `filters`, `search`, `sorts` and `pagination`
      // arguments so filtering/sorting behaves like the real backend:
      // `patientsTotal` reports the filtered count while each page returns only
      // its own slice.
      const states = variables['states'] as string[] | undefined
      const filters = (variables['filters'] as FilterClause[] | undefined) ?? []
      const search = variables['search'] as SearchInput | undefined
      const sorts = variables['sorts'] as SortClause[] | undefined
      const pagination = variables['pagination'] as { pageIndex?: number, pageSize?: number } | undefined

      let rows = patientList
      if (states && states.length > 0) {
        rows = rows.filter(p => states.includes(p.state))
      }
      rows = rows.filter(p => filters.every(clause => patientPassesFilter(p, clause)))
      rows = rows.filter(p => patientMatchesSearch(p, search))
      rows = orderBy(rows, sorts, patientSortAccessors())
      const total = rows.length
      const pageItems = paginate(rows, pagination).map(p => ({ ...p, tasks: tasksOfPatient(p.id) }))
      return respond(route, {
        data: { patients: pageItems, patientsTotal: total },
      })
    }

    case 'GetPatient': {
      const id = variables['id'] as string
      const p = patients.get(id)
      return respond(route, { data: { patient: p ? { ...p, tasks: tasksOfPatient(p.id) } : null } })
    }

    case 'GetPropertyDefinitions':
    case 'GetPropertiesForSubject':
      return respond(route, {
        data: {
          propertyDefinitions: defs.map(d => ({
            __typename: 'PropertyDefinitionType',
            id: d.id,
            name: d.name,
            description: null,
            fieldType: d.fieldType,
            isActive: true,
            allowedEntities: ['PATIENT'],
            options: d.options,
          })),
        },
      })

    case 'QueryableFields': {
      const entity = variables['entity'] as string
      const fields = entity === 'Patient'
        ? patientQueryableFields(defs)
        : entity === 'Task'
          ? taskQueryableFields()
          : []
      return respond(route, { data: { queryableFields: fields } })
    }

    case 'MySavedViews':
      return respond(route, { data: { mySavedViews: Array.from(savedViews.values()) } })

    case 'SavedView': {
      const id = variables['id'] as string
      return respond(route, { data: { savedView: savedViews.get(id) ?? null } })
    }

    case 'CreateSavedView': {
      handle.mutations.push({ name, variables })
      const data = variables['data'] as Record<string, unknown>
      const id = `view-${++savedViewSeq}`
      const view = {
        __typename: 'SavedView',
        id,
        name: String(data['name'] ?? 'view'),
        baseEntityType: String(data['baseEntityType'] ?? 'PATIENT'),
        filterDefinition: String(data['filterDefinition'] ?? '[]'),
        sortDefinition: String(data['sortDefinition'] ?? '[]'),
        parameters: String(data['parameters'] ?? '{}'),
        relatedFilterDefinition: String(data['relatedFilterDefinition'] ?? ''),
        relatedSortDefinition: String(data['relatedSortDefinition'] ?? ''),
        relatedParameters: String(data['relatedParameters'] ?? ''),
        ownerUserId: 'user-1',
        visibility: 'PRIVATE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        isOwner: true,
      }
      savedViews.set(id, view as never)
      return respond(route, { data: { createSavedView: view } })
    }

    case 'UpdateSavedView': {
      handle.mutations.push({ name, variables })
      const id = variables['id'] as string
      const data = (variables['data'] ?? {}) as Record<string, unknown>
      const current = savedViews.get(id)
      if (!current) return respond(route, { data: { updateSavedView: null } })
      for (const key of [
        'name', 'filterDefinition', 'sortDefinition', 'parameters',
        'relatedFilterDefinition', 'relatedSortDefinition', 'relatedParameters',
      ]) {
        if (data[key] != null) (current as Record<string, unknown>)[key] = data[key]
      }
      ;(current as Record<string, unknown>)['updatedAt'] = '2026-01-02T00:00:00Z'
      return respond(route, { data: { updateSavedView: current } })
    }

    case 'GetTasks': {
      const assigneeId = variables['assigneeId'] as string | undefined
      const filters = (variables['filters'] as FilterClause[] | undefined) ?? []
      const search = variables['search'] as SearchInput | undefined
      const sorts = variables['sorts'] as SortClause[] | undefined
      const pagination = variables['pagination'] as { pageIndex?: number, pageSize?: number } | undefined

      let rows = Array.from(tasks.values())
      if (assigneeId) {
        rows = rows.filter(t => t.assignees.some(a => a.id === assigneeId))
      }
      rows = rows.filter(t => filters.every(clause => taskPassesFilter(t, clause)))
      rows = rows.filter(t => taskMatchesSearch(t, search))
      rows = orderBy(rows, sorts, taskSortAccessors)
      const total = rows.length
      const pageItems = paginate(rows, pagination)
      return respond(route, { data: { tasks: pageItems, tasksTotal: total } })
    }

    case 'GetUsers':
      return respond(route, { data: { users: [] } })

    case 'GetMyTasks':
      return respond(route, { data: { me: { __typename: 'UserType', id: 'user-1', tasks: [] } } })

    case 'GetOverviewData':
      return respond(route, {
        data: { recentPatients: [], recentPatientsTotal: 0, recentTasks: [], recentTasksTotal: 0 },
      })

    case 'UpdatePatient': {
      handle.mutations.push({ name, variables })
      const id = variables['id'] as string
      const data = (variables['data'] ?? {}) as { properties?: Array<Record<string, unknown>> }
      const current = patients.get(id)
      if (current && Array.isArray(data.properties)) {
        // Re-derive properties keeping the same uuids the client already knows.
        const existingByDef = new Map(
          current.properties.map((p: { id: string, definition: { id: string } }) => [p.definition.id, p])
        )
        current.properties = data.properties.map((inp) => {
          const defId = inp['definitionId'] as string
          const prev = existingByDef.get(defId) as { id: string } | undefined
          const def = defs.find(d => d.id === defId)
          return buildProperty(
            def ?? { id: defId, name: defId, fieldType: 'FIELD_TYPE_TEXT', options: [] },
            { id: prev?.id ?? `srv-${id}-${defId}`, textValue: (inp['textValue'] as string) ?? null }
          )
        })
      }
      return respond(route, { data: { updatePatient: current } })
    }

    default:
      // Unknown/auxiliary operations: return an empty data object so the client
      // does not error out. Extend the switch above when a test needs more.
      return respond(route, { data: {} })
    }
  })

  return handle
}
