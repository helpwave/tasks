import { test, expect } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture } from './support/mockBackend'
import {
  ROW_SELECTOR,
  addSorting,
  addTagFilter,
  addTextFilter,
  beginAddFilter,
  commitFilterPopup,
  openFilterPanel,
  openSortingPanel,
  seedStoredSelection,
  setSortDirection,
  visibleRowFirstCells,
} from './support/filterSortUi'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const ALLERGY_DEF = { id: 'def-allergy', name: 'Allergy', fieldType: 'FIELD_TYPE_TEXT', options: [] }

/**
 * Small deterministic fixture. Lastnames are unique and alphabetically ordered
 * (Adams < Baker < ... < Hodge) so expected sort orders are easy to state.
 * The patient list renders the name as "lastname, firstname".
 */
const PATIENTS: PatientFixture[] = [
  { id: 'p-01', firstname: 'Ivy', lastname: 'Adams', state: 'ADMITTED', sex: 'FEMALE', birthdate: '1955-03-10', updateDate: '2026-06-05T10:00:00Z', properties: [{ id: 'v-01', definitionId: ALLERGY_DEF.id, textValue: 'Peanuts' }] },
  { id: 'p-02', firstname: 'Hank', lastname: 'Baker', state: 'WAIT', sex: 'MALE', birthdate: '1980-01-01', updateDate: '2026-06-01T10:00:00Z', properties: [{ id: 'v-02', definitionId: ALLERGY_DEF.id, textValue: 'Latex' }] },
  { id: 'p-03', firstname: 'Gwen', lastname: 'Clark', state: 'ADMITTED', sex: 'FEMALE', birthdate: '1990-07-20', updateDate: '2026-06-03T10:00:00Z', properties: [{ id: 'v-03', definitionId: ALLERGY_DEF.id, textValue: 'Aspirin' }] },
  { id: 'p-04', firstname: 'Finn', lastname: 'Davis', state: 'DISCHARGED', sex: 'MALE', birthdate: '1970-11-30', updateDate: null, properties: [] },
  { id: 'p-05', firstname: 'Eve', lastname: 'Evans', state: 'ADMITTED', sex: 'FEMALE', birthdate: '2000-05-15', updateDate: '2026-06-04T10:00:00Z', properties: [{ id: 'v-05', definitionId: ALLERGY_DEF.id, textValue: 'Pollen' }] },
  { id: 'p-06', firstname: 'Dan', lastname: 'Fischer', state: 'DEAD', sex: 'MALE', birthdate: '1940-02-02', updateDate: '2026-05-20T10:00:00Z', properties: [] },
  { id: 'p-07', firstname: 'Cara', lastname: 'Gray', state: 'WAIT', sex: 'UNKNOWN', birthdate: '1985-09-09', updateDate: '2026-06-02T10:00:00Z', properties: [{ id: 'v-07', definitionId: ALLERGY_DEF.id, textValue: 'Iodine' }] },
  { id: 'p-08', firstname: 'Ben', lastname: 'Hodge', state: 'ADMITTED', sex: 'MALE', birthdate: '1965-12-24', updateDate: '2026-06-06T10:00:00Z', properties: [{ id: 'v-08', definitionId: ALLERGY_DEF.id, textValue: 'None' }] },
]

const displayName = (p: PatientFixture) => `${p.lastname}, ${p.firstname}`
const byLastname = [...PATIENTS].sort((a, b) => a.lastname.localeCompare(b.lastname))

async function gotoPatients(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/patients`)
  await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })
}

async function expectRowNames(page: import('@playwright/test').Page, expected: string[]) {
  await expect.poll(() => visibleRowFirstCells(page), { timeout: 15000 }).toEqual(expected)
}

test.describe('patient list filtering and sorting', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
  })

  test('sorts by name ascending and descending', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openSortingPanel(page)
    await addSorting(page, 'Name')
    await expectRowNames(page, byLastname.map(displayName))

    // the request must carry a server-side sort clause for `name`
    const lastSorted = [...handle.operations].reverse().find(o => o.name === 'GetPatients')
    expect(lastSorted?.variables['sorts']).toEqual([{ fieldKey: 'name', direction: 'ASC' }])

    await setSortDirection(page, 'Name', 'DESC')
    await expectRowNames(page, [...byLastname].reverse().map(displayName))
  })

  test('sorts by birthdate', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openSortingPanel(page)
    await addSorting(page, 'Birthdate')
    const byBirthdate = [...PATIENTS].sort((a, b) => a.birthdate!.localeCompare(b.birthdate!))
    await expectRowNames(page, byBirthdate.map(displayName))

    await setSortDirection(page, 'Birthdate', 'DESC')
    await expectRowNames(page, [...byBirthdate].reverse().map(displayName))
  })

  test('sorts by a text property column (Allergy)', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openSortingPanel(page)
    await addSorting(page, 'Allergy')
    // ascending with nulls first (backend: asc().nulls_first())
    const withValue = PATIENTS.filter(p => p.properties?.length)
      .sort((a, b) => a.properties![0]!.textValue!.localeCompare(b.properties![0]!.textValue!))
    const withoutValue = PATIENTS.filter(p => !p.properties?.length)
      .sort((a, b) => a.id.localeCompare(b.id))
    await expectRowNames(page, [...withoutValue, ...withValue].map(displayName))
  })

  test('filters by name text (contains)', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openFilterPanel(page)
    await addTextFilter(page, 'Name', 'Baker')
    await expectRowNames(page, ['Baker, Hank'])

    const lastFiltered = [...handle.operations].reverse().find(o => o.name === 'GetPatients')
    const filters = lastFiltered?.variables['filters'] as Array<{ fieldKey: string, operator: string }> | undefined
    expect(filters).toBeTruthy()
    expect(filters![0]).toMatchObject({ fieldKey: 'name', operator: 'CONTAINS' })
  })

  test('filters by name text (does not contain)', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openFilterPanel(page)
    await beginAddFilter(page, 'Name')
    await page.locator('[data-name="filter-operator-select"]').click()
    await page.getByRole('option', { name: 'Not contains', exact: true }).click()
    await page.getByPlaceholder('Value').fill('Baker')
    await commitFilterPopup(page)

    // everyone except Baker (a "does not contain" filter must exclude
    // matching rows, not behave like "not equals")
    await expectRowNames(page, byLastname.filter(p => p.lastname !== 'Baker').map(displayName))

    const last = [...handle.operations].reverse().find(o => o.name === 'GetPatients')
    const filters = last?.variables['filters'] as Array<{ fieldKey: string, operator: string }> | undefined
    expect(filters?.[0]).toMatchObject({ fieldKey: 'name', operator: 'NOT_CONTAINS' })
  })

  test('filters by patient state (tag filter)', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openFilterPanel(page)
    await addTagFilter(page, 'Status', ['Admitted'])

    const admitted = byLastname.filter(p => p.state === 'ADMITTED')
    await expectRowNames(page, admitted.map(displayName))
  })

  test('filters by sex (tag filter) and combines with sorting', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await openFilterPanel(page)
    await addTagFilter(page, 'Sex', ['Male'])
    const males = byLastname.filter(p => p.sex === 'MALE')
    await expectRowNames(page, males.map(displayName))

    await openSortingPanel(page)
    await addSorting(page, 'Birthdate')
    const malesByBirthdate = [...males].sort((a, b) => a.birthdate!.localeCompare(b.birthdate!))
    await expectRowNames(page, malesByBirthdate.map(displayName))
  })

  test('search narrows the list server-side', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoPatients(page)

    await page.getByPlaceholder('Search').fill('Gray')
    await expectRowNames(page, ['Gray, Cara'])

    const lastSearch = [...handle.operations].reverse().find(o => o.name === 'GetPatients')
    expect(lastSearch?.variables['search']).toMatchObject({ searchText: 'Gray' })
  })
})
