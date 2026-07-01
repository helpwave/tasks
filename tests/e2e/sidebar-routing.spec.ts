import { test, expect, type Page } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture } from './support/mockBackend'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const PATIENTS: PatientFixture[] = [
  { id: 'p-1', firstname: 'Jane', lastname: 'Doe' },
]

async function seedStoredSelection(page: Page, ids: string[]) {
  await page.addInitScript((selected) => {
    window.localStorage.setItem('selected-root-location-ids', JSON.stringify(selected))
  }, ids)
}

/**
 * Plant a marker on `window` *after* the document has loaded. A client-side
 * (router) navigation keeps the same document, so the marker survives; a full
 * page reload creates a fresh document and wipes it. This is what lets us prove
 * the `AppPage` sidebar navigates through the router instead of doing a hard
 * `window.location` navigation.
 */
async function plantNoReloadMarker(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __noReload?: boolean }).__noReload = true
  })
}

async function markerSurvived(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true)
}

// A sidebar nav item is a `next/link` anchor tagged with this data-name; targeting
// by href keeps the test independent of the (translated) label text.
const navLink = (page: Page, href: string) =>
  page.locator(`[data-name="vertical-navigation-item-link"][href="${href}"]`).first()

// The label span carries `data-active-page` when its url matches the current
// route, which is derived reactively from `usePathname()` — so it only updates if
// navigation actually went through the client-side router.
const activeLabel = (page: Page, href: string) =>
  navLink(page, href).locator('[data-active-page]')

test.describe('AppPage sidebar routing', () => {
  test('navigates client-side without a full page reload and supports the back button', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
    await mockBackend(page, { patients: PATIENTS, rootLocations: ROOT_LOCATIONS })

    // Start on the dashboard (root route).
    await page.goto(`${BASE}/`)
    await expect(navLink(page, '/tasks')).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/$/)

    // Mark the current document so a hard reload becomes observable.
    await plantNoReloadMarker(page)
    expect(await markerSurvived(page)).toBe(true)

    // Click the "My Tasks" sidebar item.
    await navLink(page, '/tasks').click()

    // The URL updates ...
    await expect(page).toHaveURL(/\/tasks$/)
    // ... the router-derived active indicator moves to the clicked item ...
    await expect(activeLabel(page, '/tasks')).toBeVisible({ timeout: 10000 })
    // ... and crucially the document was never reloaded (client-side navigation).
    expect(await markerSurvived(page)).toBe(true)

    // The browser back button returns to the dashboard, still client-side.
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(activeLabel(page, '/')).toBeVisible({ timeout: 10000 })
    expect(await markerSurvived(page)).toBe(true)

    // Forward again, to be thorough about history navigation.
    await page.goForward()
    await expect(page).toHaveURL(/\/tasks$/)
    expect(await markerSurvived(page)).toBe(true)

    expect(errors).toEqual([])
  })

  test('activates an item via the keyboard without reloading', async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
    await mockBackend(page, { patients: PATIENTS, rootLocations: ROOT_LOCATIONS })

    await page.goto(`${BASE}/`)
    await expect(navLink(page, '/tasks')).toBeVisible({ timeout: 20000 })

    await plantNoReloadMarker(page)

    // The tree owns roving focus and starts on the active (dashboard) item. Move
    // focus down to "My Tasks" with the arrow keys, then activate it with Enter —
    // this exercises the keyboard path (which delegates to the same next/link
    // anchor as a click).
    const dashboardItem = page.locator('[data-name="vertical-navigation-item"]', { has: navLink(page, '/') })
    await dashboardItem.focus()
    await expect(dashboardItem).toBeFocused()

    await page.keyboard.press('ArrowDown')
    const tasksItem = page.locator('[data-name="vertical-navigation-item"]', { has: navLink(page, '/tasks') })
    await expect(tasksItem).toBeFocused()

    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/tasks$/)
    expect(await markerSurvived(page)).toBe(true)
  })
})
