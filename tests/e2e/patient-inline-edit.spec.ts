import { test, expect, type Locator, type Page } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture } from './support/mockBackend'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [{ id: 'root-1', title: 'General Hospital', kind: 'CLINIC' }]
const ALLERGY_DEF = { id: 'def-allergy', name: 'Allergy', fieldType: 'FIELD_TYPE_TEXT', options: [] }

async function seedStoredSelection(page: Page, ids: string[]) {
  await page.addInitScript((selected) => {
    window.localStorage.setItem('selected-root-location-ids', JSON.stringify(selected))
  }, ids)
}

function rowByLastName(page: Page, lastName: string): Locator {
  return page.locator('tr[data-name="table-body-row"]').filter({ hasText: lastName })
}

function allergyCell(row: Locator): Locator {
  return row.locator('[data-testid="editable-property-cell"][data-property-definition-id="def-allergy"]')
}

async function openEditor(page: Page, cell: Locator): Promise<Locator> {
  await cell.getByRole('button').first().click()
  const input = page.getByRole('textbox').last()
  await expect(input).toBeVisible()
  return input
}

async function commit(page: Page) {
  await page.getByRole('button', { name: 'Done' }).click()
}

test.describe('patient inline property edit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
  })

  test('setting a value on a previously empty property persists after the refetch', async ({ page }) => {
    // Regression (videos): an inline edit was written to the backend but the
    // list cell reverted to empty once the post-mutation refetch landed, because
    // the cache merged the stale (empty) server snapshot back over the edit.
    const handle = await mockBackend(page, {
      patients: [{ id: 'p-1', firstname: 'Jane', lastname: 'Doe' }],
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })

    await page.goto(`${BASE}/patients`)
    const row = rowByLastName(page, 'Doe')
    await expect(row).toBeVisible({ timeout: 20000 })

    const cell = allergyCell(row)
    const input = await openEditor(page, cell)
    await input.fill('Penicillin')
    await commit(page)

    // Optimistic value shows ...
    await expect(cell).toContainText('Penicillin')

    // ... and survives the UpdatePatient + refetch round-trip.
    await page.waitForLoadState('networkidle')
    await expect(cell).toContainText('Penicillin')

    const update = handle.mutations.find(m => m.name === 'UpdatePatient')
    expect(update?.variables['id']).toBe('p-1')
  })

  test('clearing a property removes it and it stays cleared after the refetch', async ({ page }) => {
    // Regression (issue: empty selection / clearing): the cache policy unioned
    // the previous and incoming property arrays, so a cleared property was
    // re-added from the stale cache value and reappeared after the refetch.
    await mockBackend(page, {
      patients: [{
        id: 'p-1',
        firstname: 'Jane',
        lastname: 'Doe',
        properties: [{ id: 'prop-1', definitionId: 'def-allergy', textValue: 'Penicillin' }],
      }],
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })

    await page.goto(`${BASE}/patients`)
    const row = rowByLastName(page, 'Doe')
    const cell = allergyCell(row)
    await expect(cell).toContainText('Penicillin', { timeout: 20000 })

    const input = await openEditor(page, cell)
    await input.fill('')
    await commit(page)

    await page.waitForLoadState('networkidle')
    await expect(cell).not.toContainText('Penicillin')
  })
})
