import { test, expect, type Page } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture, type SavedViewFixture, type TaskFixture } from './support/mockBackend'
import {
  ROW_SELECTOR,
  addSorting,
  addSingleTagEqualsFilter,
  beginAddFilter,
  commitFilterPopup,
  openFilterPanel,
  openSortingPanel,
  seedStoredSelection,
  visibleRowFirstCells,
} from './support/filterSortUi'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const PATIENTS: PatientFixture[] = [
  { id: 'p-01', firstname: 'Ivy', lastname: 'Adams', state: 'ADMITTED', sex: 'FEMALE', birthdate: '1955-03-10' },
  { id: 'p-02', firstname: 'Hank', lastname: 'Baker', state: 'WAIT', sex: 'MALE', birthdate: '1980-01-01' },
  { id: 'p-03', firstname: 'Gwen', lastname: 'Clark', state: 'ADMITTED', sex: 'FEMALE', birthdate: '1990-07-20' },
  { id: 'p-04', firstname: 'Finn', lastname: 'Davis', state: 'DISCHARGED', sex: 'MALE', birthdate: '1970-11-30' },
]

/**
 * Related tasks: the latest task update per patient determines the patient's
 * "Updated" value in a task view's patients panel. Deliberately ordered so
 * update-date order (Clark < Baker < Adams) differs from name order.
 */
const TASKS: TaskFixture[] = [
  { id: 't-01', title: 'Draw blood', priority: 'P2', patientId: 'p-01', assigneeIds: ['user-1'], dueDate: '2026-07-08T09:00:00Z', updateDate: '2026-06-03T10:00:00Z' },
  { id: 't-02', title: 'Administer meds', priority: 'P1', patientId: 'p-02', assigneeIds: ['user-1'], dueDate: '2026-07-06T09:00:00Z', updateDate: '2026-06-05T10:00:00Z' },
  { id: 't-03', title: 'Check vitals', priority: 'P4', patientId: 'p-03', assigneeIds: ['user-1'], dueDate: '2026-07-07T09:00:00Z', updateDate: '2026-06-01T10:00:00Z' },
  { id: 't-04', title: 'Update chart', priority: null, patientId: 'p-01', assigneeIds: ['user-1'], dueDate: null, updateDate: '2026-06-06T10:00:00Z' },
]

const stateFilterDefinition = JSON.stringify([
  {
    id: 'state',
    value: { dataType: 'singleTag', operator: 'contains', parameter: { uuidValues: ['ADMITTED'] } },
  },
])

// legacy serialization: tag selection stored under `searchTags`
const legacyStateFilterDefinition = JSON.stringify([
  {
    id: 'state',
    value: { dataType: 'singleTag', operator: 'contains', parameter: { searchTags: ['ADMITTED'] } },
  },
])

const priorityFilterDefinition = JSON.stringify([
  {
    id: 'priority',
    value: { dataType: 'singleTag', operator: 'contains', parameter: { uuidValues: ['P1', 'P2'] } },
  },
])

function patientView(overrides: Partial<SavedViewFixture>): SavedViewFixture {
  return {
    id: 'view-patient',
    name: 'Admitted patients',
    baseEntityType: 'PATIENT',
    filterDefinition: stateFilterDefinition,
    sortDefinition: JSON.stringify([{ id: 'name', desc: true }]),
    parameters: JSON.stringify({ rootLocationIds: ['root-1'] }),
    ...overrides,
  }
}

function taskView(overrides: Partial<SavedViewFixture>): SavedViewFixture {
  return {
    id: 'view-task',
    name: 'Important tasks',
    baseEntityType: 'TASK',
    filterDefinition: priorityFilterDefinition,
    sortDefinition: JSON.stringify([{ id: 'patient', desc: false }]),
    parameters: JSON.stringify({ rootLocationIds: ['root-1'], assigneeId: 'user-1' }),
    ...overrides,
  }
}

async function gotoView(page: Page, id: string) {
  await page.goto(`${BASE}/view/${id}`)
  await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })
}

async function expectFirstCells(page: Page, expected: string[]) {
  await expect.poll(() => visibleRowFirstCells(page), { timeout: 15000 }).toEqual(expected)
}

/** Task rows: cell 0 is the done checkbox, cell 1 the title. */
async function taskRowTitles(page: Page): Promise<string[]> {
  return page.$$eval(ROW_SELECTOR, (rows) =>
    rows.map((row) => row.querySelectorAll('td')[1]?.textContent?.trim() ?? ''))
}

test.describe('custom views (saved views) filtering and sorting', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
  })

  test('patient view applies its stored filter and sorting', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [patientView({})],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-patient')

    // only admitted patients, name descending (Clark > Adams)
    await expectFirstCells(page, ['Clark, Gwen', 'Adams, Ivy'])
    await expect(page.getByRole('button', { name: 'Filter (1)' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sorting (1)' })).toBeVisible()

    const last = [...handle.operations].reverse().find(o => o.name === 'GetPatients')
    expect(last?.variables['sorts']).toEqual([{ fieldKey: 'name', direction: 'DESC' }])
    const filters = last?.variables['filters'] as Array<{ fieldKey: string, operator: string, value: { uuidValues?: string[] } }>
    expect(filters?.[0]).toMatchObject({ fieldKey: 'state', operator: 'IN' })
  })

  test('legacy patient view (searchTags serialization) still filters', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [patientView({ filterDefinition: legacyStateFilterDefinition, sortDefinition: '[]' })],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-patient')

    await expectFirstCells(page, ['Adams, Ivy', 'Clark, Gwen'])
  })

  test('task view applies its stored filter and sorting (sort by patient)', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [taskView({})],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-task')

    // P1/P2 tasks only, ascending by patient query name
    // (Hank Baker < Ivy Adams): Administer meds (Baker), Draw blood (Adams)
    await expect.poll(() => taskRowTitles(page), { timeout: 15000 })
      .toEqual(['Administer meds', 'Draw blood'])

    const last = [...handle.operations].reverse().find(o => o.name === 'GetTasks')
    expect(last?.variables['sorts']).toEqual([{ fieldKey: 'patient', direction: 'ASC' }])
  })

  test('saving a new view from the patients page stores filters and sorting', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: [],
      rootLocations: ROOT_LOCATIONS,
    })
    await page.goto(`${BASE}/patients`)
    await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })

    await openFilterPanel(page)
    await beginAddFilter(page, 'Name')
    await page.getByPlaceholder('Value').fill('a')
    await commitFilterPopup(page)
    await openSortingPanel(page)
    await addSorting(page, 'Birthdate')

    await page.getByRole('button', { name: 'Save as new quick access' }).click()
    const dialog = page.getByRole('dialog').last()
    await dialog.locator('input').fill('My saved patients')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()

    await expect.poll(() => handle.mutations.filter(m => m.name === 'CreateSavedView').length).toBe(1)
    const created = handle.mutations.find(m => m.name === 'CreateSavedView')!
    const data = created.variables['data'] as Record<string, string>
    expect(data['name']).toBe('My saved patients')
    expect(data['baseEntityType']).toBe('PATIENT')
    expect(JSON.parse(data['sortDefinition'])).toEqual([{ id: 'birthdate', desc: false }])
    const storedFilters = JSON.parse(data['filterDefinition']) as Array<{ id: string, value: { operator: string } }>
    expect(storedFilters[0]).toMatchObject({ id: 'name', value: { operator: 'contains' } })

    // the stored view is immediately usable
    await gotoView(page, 'view-1')
    // names containing 'a': all four patients; sorted by birthdate asc
    await expectFirstCells(page, ['Adams, Ivy', 'Davis, Finn', 'Baker, Hank', 'Clark, Gwen'])
  })

  test('overwriting a view persists the modified sorting', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [patientView({ sortDefinition: '[]' })],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-patient')
    await expectFirstCells(page, ['Adams, Ivy', 'Clark, Gwen'])

    await openSortingPanel(page)
    await addSorting(page, 'Name')
    await page.getByRole('button', { name: 'Name', exact: true }).click()
    await page.getByRole('button', { name: 'DESC', exact: true }).click()
    await page.keyboard.press('Escape')
    await expectFirstCells(page, ['Clark, Gwen', 'Adams, Ivy'])

    await page.getByRole('button', { name: 'Save quick access' }).click()
    await page.getByText('Overwrite current quick access').click()

    await expect.poll(() => handle.mutations.filter(m => m.name === 'UpdateSavedView').length).toBe(1)
    const update = handle.mutations.find(m => m.name === 'UpdateSavedView')!
    const data = update.variables['data'] as Record<string, string>
    expect(JSON.parse(data['sortDefinition'])).toEqual([{ id: 'name', desc: true }])
  })

  test('discarding view changes restores the stored filter and sorting', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [patientView({ sortDefinition: JSON.stringify([{ id: 'name', desc: false }]) })],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-patient')
    await expectFirstCells(page, ['Adams, Ivy', 'Clark, Gwen'])

    // deviate from the stored view: drop the state filter
    await openFilterPanel(page)
    await page.getByRole('button', { name: /Status/ }).click()
    await page.getByRole('button', { name: 'Remove filter' }).click()
    await expectFirstCells(page, ['Adams, Ivy', 'Baker, Hank', 'Clark, Gwen', 'Davis, Finn'])

    await page.getByRole('button', { name: 'Discard changes' }).click()
    await expectFirstCells(page, ['Adams, Ivy', 'Clark, Gwen'])
  })

  test('task view: related patients panel sorts by Updated (latest task update)', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [taskView({ filterDefinition: '[]', sortDefinition: '[]' })],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-task')

    await page.getByRole('tab', { name: 'Patients' }).click()
    // derived from tasks: Adams (t-01,t-04), Baker (t-02), Clark (t-03),
    // default order by name
    await expectFirstCells(page, ['Adams, Ivy', 'Baker, Hank', 'Clark, Gwen'])

    await openSortingPanel(page)
    await addSorting(page, 'Updated')
    // ascending by latest related-task update:
    // Clark (06-01) < Baker (06-05) < Adams (06-06)
    await expectFirstCells(page, ['Clark, Gwen', 'Baker, Hank', 'Adams, Ivy'])
  })

  test('patient view: related tasks panel filters by priority with the equals operator', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      savedViews: [patientView({ filterDefinition: '[]', sortDefinition: '[]' })],
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoView(page, 'view-patient')

    await page.getByRole('tab', { name: 'Tasks' }).click()
    // tasks of admitted/waiting patients: all four fixtures
    await expect.poll(() => taskRowTitles(page), { timeout: 15000 })
      .toEqual(['Update chart', 'Administer meds', 'Check vitals', 'Draw blood'])

    await openFilterPanel(page)
    await addSingleTagEqualsFilter(page, 'Priority', 'Normal')

    await expect(page.locator('button:visible', { hasText: 'Filter (1)' })).toBeVisible()
    await expect.poll(() => taskRowTitles(page), { timeout: 15000 })
      .toEqual(['Administer meds'])
  })
})
