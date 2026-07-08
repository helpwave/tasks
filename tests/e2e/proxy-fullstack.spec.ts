import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import {
  ROW_SELECTOR,
  addSorting,
  openSortingPanel,
  setSortDirection,
  visibleRowFirstCells,
} from './support/filterSortUi'

const PROXY_TARGET = process.env.E2E_PROXY_TARGET === '1'
const BASE = (process.env.E2E_BASE_URL || 'http://localhost').replace(/\/$/, '')

const RUN_ID = `e2e${Date.now().toString(36)}`

const USERNAME = process.env.E2E_USERNAME || 'test'
const PASSWORD = process.env.E2E_PASSWORD || 'test'
const CLIENT_ID = 'tasks-web'
const TOKEN_URL = `${BASE}/keycloak/realms/tasks/protocol/openid-connect/token`

async function getAccessToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(TOKEN_URL, {
    form: {
      grant_type: 'password',
      client_id: CLIENT_ID,
      username: USERNAME,
      password: PASSWORD,
      scope: 'openid profile email organization',
    },
  })
  expect(response.ok(), `token endpoint through the proxy: ${response.status()}`).toBeTruthy()
  const body = await response.json() as { access_token?: string }
  expect(body.access_token, 'access token from the proxied keycloak').toBeTruthy()
  return body.access_token!
}

async function gql<T = Record<string, unknown>>(
  request: APIRequestContext,
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await request.post(`${BASE}/graphql`, {
    headers: { authorization: `Bearer ${token}` },
    data: { query, variables: variables ?? {} },
  })
  expect(response.ok(), `graphql through the proxy: ${response.status()}`).toBeTruthy()
  const body = await response.json() as { data?: T, errors?: Array<{ message: string }> }
  expect(body.errors, `graphql errors: ${JSON.stringify(body.errors)}`).toBeUndefined()
  return body.data as T
}

type Me = { id: string, username: string, rootLocations: Array<{ id: string, title: string, kind: string }> }

async function fetchMe(request: APIRequestContext, token: string): Promise<Me> {
  const data = await gql<{ me: Me }>(request, token, `
    query { me { id username rootLocations { id title kind } } }
  `)
  expect(data.me, 'me through the proxy').toBeTruthy()
  return data.me
}

type SeededContext = {
  token: string,
  me: Me,
  rootLocationIds: string[],
  patients: Array<{ id: string, name: string, lastname: string }>,
}

async function seedData(request: APIRequestContext): Promise<SeededContext> {
  const token = await getAccessToken(request)
  const me = await fetchMe(request, token)
  expect(me.rootLocations.length, 'user has root locations (scaffold import)').toBeGreaterThan(0)
  const rootLocationIds = me.rootLocations.map(l => l.id)

  const { locationNodes } = await gql<{ locationNodes: Array<{ id: string, title: string, kind: string }> }>(
    request,
    token,
    `query { locationNodes { id title kind } }`
  )
  const clinic = locationNodes.find(l => l.kind === 'CLINIC')
  expect(clinic, 'a clinic exists in the scaffold data').toBeTruthy()

  const fixtures = [
    { firstname: 'Zoe', lastname: `${RUN_ID}-alpha`, birthdate: '1990-01-10' },
    { firstname: 'Max', lastname: `${RUN_ID}-mid`, birthdate: '1970-05-20' },
    { firstname: 'Amy', lastname: `${RUN_ID}-zeta`, birthdate: '1980-09-30' },
  ]
  const patients: SeededContext['patients'] = []
  for (const f of fixtures) {
    const { createPatient } = await gql<{ createPatient: { id: string, name: string, lastname: string } }>(
      request,
      token,
      `mutation Create($data: CreatePatientInput!) {
        createPatient(data: $data) { id name lastname }
      }`,
      {
        data: {
          firstname: f.firstname,
          lastname: f.lastname,
          birthdate: f.birthdate,
          sex: 'FEMALE',
          state: 'ADMITTED',
          clinicId: clinic!.id,
        },
      }
    )
    patients.push(createPatient)

    await gql(request, token, `
      mutation CreateTask($data: CreateTaskInput!) {
        createTask(data: $data) { id title }
      }`,
    {
      data: {
        title: `Task ${f.lastname}`,
        patientId: createPatient.id,
        assigneeIds: [me.id],
      },
    })
  }

  return { token, me, rootLocationIds, patients }
}

test.describe('full stack behind the nginx proxy', () => {
  test.skip(!PROXY_TARGET, 'requires the docker proxy stack (E2E_PROXY_TARGET=1)')
  test.describe.configure({ mode: 'serial' })

  let seeded: SeededContext

  test('proxy routes /, /keycloak and /graphql to the right services', async ({ request }) => {
    const home = await request.get(`${BASE}/`)
    expect(home.status()).toBe(200)
    expect(home.headers()['content-type'] ?? '').toContain('text/html')

    const oidc = await request.get(`${BASE}/keycloak/realms/tasks/.well-known/openid-configuration`)
    expect(oidc.status()).toBe(200)
    const oidcBody = await oidc.json() as { issuer?: string, token_endpoint?: string }
    expect(oidcBody.issuer ?? '').toContain('/keycloak/realms/tasks')

    const graphql = await request.post(`${BASE}/graphql`, { data: { query: '{ __typename }' } })
    expect(graphql.status()).toBeLessThan(500)
    expect(graphql.headers()['content-type'] ?? '').not.toContain('text/html')
  })

  test('authenticates through the proxied keycloak and reads data', async ({ request }) => {
    seeded = await seedData(request)
    expect(seeded.me.username).toBe(USERNAME)
    expect(seeded.patients).toHaveLength(3)
  })

  test('backend filters and sorts patients through the proxy', async ({ request }) => {
    const { token, rootLocationIds } = seeded
    const query = `
      query Patients($rootLocationIds: [ID!], $filters: [QueryFilterClauseInput!], $sorts: [QuerySortClauseInput!]) {
        patients(rootLocationIds: $rootLocationIds, filters: $filters, sorts: $sorts) { id lastname }
        patientsTotal(rootLocationIds: $rootLocationIds, filters: $filters, sorts: $sorts)
      }`
    const containsRun = [{
      fieldKey: 'name',
      operator: 'CONTAINS',
      value: { stringValue: RUN_ID },
    }]

    const asc = await gql<{ patients: Array<{ lastname: string }>, patientsTotal: number }>(
      request, token, query,
      { rootLocationIds, filters: containsRun, sorts: [{ fieldKey: 'name', direction: 'ASC' }] }
    )
    expect(asc.patientsTotal).toBe(3)
    expect(asc.patients.map(p => p.lastname)).toEqual([
      `${RUN_ID}-alpha`, `${RUN_ID}-mid`, `${RUN_ID}-zeta`,
    ])

    const desc = await gql<{ patients: Array<{ lastname: string }> }>(
      request, token, query,
      { rootLocationIds, filters: containsRun, sorts: [{ fieldKey: 'name', direction: 'DESC' }] }
    )
    expect(desc.patients.map(p => p.lastname)).toEqual([
      `${RUN_ID}-zeta`, `${RUN_ID}-mid`, `${RUN_ID}-alpha`,
    ])

    const byBirthdate = await gql<{ patients: Array<{ lastname: string }> }>(
      request, token, query,
      { rootLocationIds, filters: containsRun, sorts: [{ fieldKey: 'birthdate', direction: 'ASC' }] }
    )
    expect(byBirthdate.patients.map(p => p.lastname)).toEqual([
      `${RUN_ID}-mid`, `${RUN_ID}-zeta`, `${RUN_ID}-alpha`,
    ])

    const byUpdated = await gql<{ patients: Array<{ lastname: string }> }>(
      request, token, query,
      { rootLocationIds, filters: containsRun, sorts: [{ fieldKey: 'updateDate', direction: 'DESC' }] }
    )
    expect(byUpdated.patients).toHaveLength(3)

    const excluded = await gql<{ patients: Array<{ lastname: string }>, patientsTotal: number }>(
      request, token, query,
      {
        rootLocationIds,
        filters: [{ fieldKey: 'name', operator: 'NOT_CONTAINS', value: { stringValue: RUN_ID } }],
        sorts: [],
      }
    )
    expect(excluded.patients.every(p => !p.lastname.includes(RUN_ID))).toBe(true)
  })

  test('backend sorts tasks by patient through the proxy (issue #213)', async ({ request }) => {
    const { token, me, rootLocationIds } = seeded
    const query = `
      query Tasks($rootLocationIds: [ID!], $assigneeId: ID, $filters: [QueryFilterClauseInput!], $sorts: [QuerySortClauseInput!]) {
        tasks(rootLocationIds: $rootLocationIds, assigneeId: $assigneeId, filters: $filters, sorts: $sorts) {
          id title patient { lastname }
        }
      }`
    const filters = [{ fieldKey: 'title', operator: 'CONTAINS', value: { stringValue: RUN_ID } }]

    const asc = await gql<{ tasks: Array<{ patient: { lastname: string } | null }> }>(
      request, token, query,
      { rootLocationIds, assigneeId: me.id, filters, sorts: [{ fieldKey: 'patient', direction: 'ASC' }] }
    )
    expect(asc.tasks.map(t => t.patient?.lastname)).toEqual([
      `${RUN_ID}-zeta`, `${RUN_ID}-mid`, `${RUN_ID}-alpha`,
    ])

    const desc = await gql<{ tasks: Array<{ patient: { lastname: string } | null }> }>(
      request, token, query,
      { rootLocationIds, assigneeId: me.id, filters, sorts: [{ fieldKey: 'patient', direction: 'DESC' }] }
    )
    expect(desc.tasks.map(t => t.patient?.lastname)).toEqual([
      `${RUN_ID}-alpha`, `${RUN_ID}-mid`, `${RUN_ID}-zeta`,
    ])
  })

  test('UI: login via the proxied keycloak and sort the patient list', async ({ page, request }) => {
    await page.addInitScript((ids) => {
      window.localStorage.setItem('selected-root-location-ids', JSON.stringify(ids))
    }, seeded.rootLocationIds)

    await page.goto(`${BASE}/`)
    await page.waitForURL('**/keycloak/realms/tasks/**', { timeout: 30000 })
    await page.locator('#username').fill(USERNAME)
    await page.locator('#password').fill(PASSWORD)
    await page.locator('#kc-login').click()
    await page.waitForURL((url) => url.pathname === '/', { timeout: 30000 })

    await page.goto(`${BASE}/patients`)
    await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 30000 })

    await page.getByPlaceholder('Search').fill(RUN_ID)
    await expect.poll(() => page.locator(ROW_SELECTOR).count(), { timeout: 20000 }).toBe(3)

    await openSortingPanel(page)
    await addSorting(page, 'Name')
    await expect.poll(async () => {
      const names = await visibleRowFirstCells(page)
      return names.map(n => n.includes('-alpha') ? 'alpha' : n.includes('-mid') ? 'mid' : n.includes('-zeta') ? 'zeta' : n)
    }, { timeout: 20000 }).toEqual(['alpha', 'mid', 'zeta'])

    await setSortDirection(page, 'Name', 'DESC')
    await expect.poll(async () => {
      const names = await visibleRowFirstCells(page)
      return names.map(n => n.includes('-alpha') ? 'alpha' : n.includes('-mid') ? 'mid' : n.includes('-zeta') ? 'zeta' : n)
    }, { timeout: 20000 }).toEqual(['zeta', 'mid', 'alpha'])
  })
})
