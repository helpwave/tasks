import type { Page, Route } from '@playwright/test'

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

export type MockOptions = {
  patients: PatientFixture[],
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

export async function mockBackend(page: Page, options: MockOptions): Promise<MockHandle> {
  const defs = options.propertyDefinitions ?? []
  const rootLocations = options.rootLocations ?? [
    { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
  ]
  const handle: MockHandle = { operations: [], mutations: [] }

  // mutable patient store so optimistic edits + refetches stay consistent
  const patients = new Map(options.patients.map(p => [p.id, fullPatient(p, defs)]))

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
      // Honour the `pagination` argument so infinite scroll behaves like the real
      // backend: each page returns only its own slice while `patientsTotal`
      // reports the full count. Omitting pagination (or a non-positive pageSize)
      // returns the whole list, preserving the previous single-page behaviour.
      const pagination = variables['pagination'] as { pageIndex?: number, pageSize?: number } | undefined
      const total = patientList.length
      let pageItems = patientList
      if (pagination && typeof pagination.pageSize === 'number' && pagination.pageSize > 0) {
        const pageIndex = typeof pagination.pageIndex === 'number' ? pagination.pageIndex : 0
        const start = pageIndex * pagination.pageSize
        pageItems = patientList.slice(start, start + pagination.pageSize)
      }
      return respond(route, {
        data: { patients: pageItems, patientsTotal: total },
      })
    }

    case 'GetPatient': {
      const id = variables['id'] as string
      return respond(route, { data: { patient: patients.get(id) ?? null } })
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

    case 'QueryableFields':
      return respond(route, { data: { queryableFields: [] } })

    case 'MySavedViews':
      return respond(route, { data: { mySavedViews: [] } })

    case 'GetTasks':
      return respond(route, { data: { tasks: [], tasksTotal: 0 } })

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
