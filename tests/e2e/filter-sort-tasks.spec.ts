import { test, expect } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture, type TaskFixture } from './support/mockBackend'
import {
  ROW_SELECTOR,
  addSorting,
  addTagFilter,
  addTextFilter,
  openFilterPanel,
  openSortingPanel,
  removeSorting,
  seedStoredSelection,
  setSortDirection,
} from './support/filterSortUi'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const PATIENTS: PatientFixture[] = [
  { id: 'p-01', firstname: 'Ivy', lastname: 'Adams', state: 'ADMITTED', sex: 'FEMALE', birthdate: '1955-03-10' },
  { id: 'p-02', firstname: 'Hank', lastname: 'Baker', state: 'ADMITTED', sex: 'MALE', birthdate: '1980-01-01' },
  { id: 'p-03', firstname: 'Gwen', lastname: 'Clark', state: 'WAIT', sex: 'FEMALE', birthdate: '1990-07-20' },
]

/**
 * All tasks are open (not done) unless stated otherwise, assigned to the
 * mock session user `user-1` (the tasks page shows "my tasks"). Titles are
 * unique so rows are identifiable. Patient query names ("firstname lastname"):
 * p-01 = "Ivy Adams", p-02 = "Hank Baker", p-03 = "Gwen Clark".
 */
const TASKS: TaskFixture[] = [
  { id: 't-01', title: 'Draw blood', dueDate: '2026-07-08T09:00:00Z', priority: 'P2', patientId: 'p-02', assigneeIds: ['user-1'] },
  { id: 't-02', title: 'Administer meds', dueDate: '2026-07-06T09:00:00Z', priority: 'P1', patientId: 'p-01', assigneeIds: ['user-1'] },
  { id: 't-03', title: 'Check vitals', dueDate: '2026-07-07T09:00:00Z', priority: 'P4', patientId: 'p-03', assigneeIds: ['user-1'] },
  { id: 't-04', title: 'Update chart', dueDate: null, priority: null, patientId: null, assigneeIds: ['user-1'] },
  { id: 't-05', title: 'Book MRI', dueDate: '2026-07-05T09:00:00Z', priority: 'P3', patientId: 'p-01', assigneeIds: ['user-1'], done: true },
]

async function gotoTasks(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/tasks`)
  await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })
}

/** Task title column: cell 0 is the done checkbox, cell 1 the title. */
async function rowTitles(page: import('@playwright/test').Page): Promise<string[]> {
  return page.$$eval(ROW_SELECTOR, (rows) =>
    rows.map((row) => row.querySelectorAll('td')[1]?.textContent?.trim() ?? ''))
}

async function expectRowTitles(page: import('@playwright/test').Page, expected: string[]) {
  await expect.poll(() => rowTitles(page), { timeout: 15000 }).toEqual(expected)
}

test.describe('task list filtering and sorting', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
  })

  test('default order: open tasks by due date first, done tasks last', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    // default sorting is done asc (open first), then dueDate asc (nulls first)
    await expectRowTitles(page, ['Update chart', 'Administer meds', 'Check vitals', 'Draw blood', 'Book MRI'])
    const last = [...handle.operations].reverse().find(o => o.name === 'GetTasks')
    expect(last?.variables['sorts']).toEqual([
      { fieldKey: 'done', direction: 'ASC' },
      { fieldKey: 'dueDate', direction: 'ASC' },
    ])
  })

  test('sorts by patient name ascending and descending', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openSortingPanel(page)
    // replace the default sorting with patient so the assertion is unambiguous
    await removeSorting(page, 'Done')
    await removeSorting(page, 'Due Date')
    await addSorting(page, 'Patient')

    // ascending by patient display name ("firstname lastname":
    // Gwen Clark < Hank Baker < Ivy Adams), tasks without patient first
    await expectRowTitles(page, [
      'Update chart', // no patient (nulls first)
      'Check vitals', // Gwen Clark
      'Draw blood', // Hank Baker
      'Administer meds', // Ivy Adams (id tiebreak)
      'Book MRI', // Ivy Adams
    ])

    const lastSorted = [...handle.operations].reverse().find(o => o.name === 'GetTasks')
    expect(lastSorted?.variables['sorts']).toEqual([{ fieldKey: 'patient', direction: 'ASC' }])

    await setSortDirection(page, 'Patient', 'DESC')
    await expectRowTitles(page, [
      'Administer meds', // Ivy Adams (id tiebreak)
      'Book MRI', // Ivy Adams
      'Draw blood', // Hank Baker
      'Check vitals', // Gwen Clark
      'Update chart', // no patient (nulls last)
    ])
  })

  test('sorts by title', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openSortingPanel(page)
    await removeSorting(page, 'Done')
    await removeSorting(page, 'Due Date')
    await addSorting(page, 'Title')
    await expectRowTitles(page, ['Administer meds', 'Book MRI', 'Check vitals', 'Draw blood', 'Update chart'])

    await setSortDirection(page, 'Title', 'DESC')
    await expectRowTitles(page, ['Update chart', 'Draw blood', 'Check vitals', 'Book MRI', 'Administer meds'])
  })

  test('sorts by priority', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openSortingPanel(page)
    await removeSorting(page, 'Done')
    await removeSorting(page, 'Due Date')
    await addSorting(page, 'Priority')

    // P1 < P2 < P3 < P4 < none (backend priority case ordering)
    await expectRowTitles(page, ['Administer meds', 'Draw blood', 'Book MRI', 'Check vitals', 'Update chart'])
  })

  test('filters by title text (contains)', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openFilterPanel(page)
    await addTextFilter(page, 'Title', 'blood')
    await expectRowTitles(page, ['Draw blood'])

    const last = [...handle.operations].reverse().find(o => o.name === 'GetTasks')
    const filters = last?.variables['filters'] as Array<{ fieldKey: string, operator: string }> | undefined
    expect(filters?.[0]).toMatchObject({ fieldKey: 'title', operator: 'CONTAINS' })
  })

  test('filters by priority (tag filter)', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openFilterPanel(page)
    // app labels: P1 Normal, P2 Medium, P3 High, P4 Critical
    await addTagFilter(page, 'Priority', ['Normal', 'Medium'])
    await expectRowTitles(page, ['Administer meds', 'Draw blood'])
  })

  test('filters by patient name text', async ({ page }) => {
    await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await openFilterPanel(page)
    await addTextFilter(page, 'Patient', 'Adams')
    // both tasks of Ivy Adams, in default order (done last)
    await expectRowTitles(page, ['Administer meds', 'Book MRI'])
  })

  test('search matches title and patient name server-side', async ({ page }) => {
    const handle = await mockBackend(page, {
      patients: PATIENTS,
      tasks: TASKS,
      rootLocations: ROOT_LOCATIONS,
    })
    await gotoTasks(page)

    await page.getByPlaceholder('Search').fill('vitals')
    await expectRowTitles(page, ['Check vitals'])

    const last = [...handle.operations].reverse().find(o => o.name === 'GetTasks')
    expect(last?.variables['search']).toMatchObject({ searchText: 'vitals' })

    await page.getByPlaceholder('Search').fill('Baker')
    await expectRowTitles(page, ['Draw blood'])
  })
})
