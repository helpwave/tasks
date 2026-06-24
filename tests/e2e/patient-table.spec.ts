import { test, expect, type Page } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture } from './support/mockBackend'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const ALLERGY_DEF = { id: 'def-allergy', name: 'Allergy', fieldType: 'FIELD_TYPE_TEXT', options: [] }

const PATIENT_COUNT = 77

// LIST_PAGE_SIZE in web/utils/listPaging.ts. The list fetches one page at a
// time and accumulates pages as the user scrolls, so 77 patients span four
// pages (25 + 25 + 25 + 2).
const PAGE_SIZE = 25

const STATES = ['ADMITTED', 'DISCHARGED', 'DEAD', 'WAIT'] as const
const SEXES = ['MALE', 'FEMALE', 'UNKNOWN'] as const
const ALLERGIES = ['Penicillin', 'Latex', 'Peanuts', 'Pollen', 'None', 'Aspirin', 'Iodine']
const FIRST_NAMES = [
  'Alex', 'Bea', 'Cory', 'Dana', 'Eli', 'Fran', 'Gale', 'Hana', 'Ivo', 'Jules',
  'Kai', 'Lou', 'Max', 'Noa', 'Ola', 'Pat', 'Quin', 'Remy', 'Sam', 'Tory',
]

/**
 * Deterministic pseudo-random generator so the fixture (and therefore the test)
 * is reproducible across runs while still spreading patients across different
 * states, sexes, birthdates and property values.
 */
function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

function generatePatients(count: number): PatientFixture[] {
  const rng = makeRng(0xc0ffee)
  const patients: PatientFixture[] = []
  for (let i = 0; i < count; i++) {
    const index = String(i + 1).padStart(2, '0')
    const firstname = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]!
    // Unique surname per patient guarantees every visible row text is distinct,
    // which is what lets the test assert "no duplicates" purely from the DOM.
    const lastname = `Patient_${index}`
    const year = 1940 + Math.floor(rng() * 70)
    const month = String(1 + Math.floor(rng() * 12)).padStart(2, '0')
    const day = String(1 + Math.floor(rng() * 28)).padStart(2, '0')
    patients.push({
      id: `patient-${index}`,
      firstname,
      lastname,
      state: STATES[Math.floor(rng() * STATES.length)],
      sex: SEXES[Math.floor(rng() * SEXES.length)],
      birthdate: `${year}-${month}-${day}`,
      updateDate: rng() > 0.5 ? `2026-0${1 + Math.floor(rng() * 6)}-15T10:00:00Z` : null,
      properties: [
        {
          id: `prop-${index}`,
          definitionId: 'def-allergy',
          textValue: ALLERGIES[Math.floor(rng() * ALLERGIES.length)]!,
        },
      ],
    })
  }
  return patients
}

const PATIENTS = generatePatients(PATIENT_COUNT)

async function seedStoredSelection(page: Page, ids: string[]) {
  await page.addInitScript((selected) => {
    window.localStorage.setItem('selected-root-location-ids', JSON.stringify(selected))
  }, ids)
}

const ROW_SELECTOR = 'tr[data-name="table-body-row"]'

/** Text of the first (name) cell of every rendered data row, in DOM order. */
async function visibleRowNames(page: Page): Promise<string[]> {
  return page.$$eval(ROW_SELECTOR, (rows) =>
    rows.map((row) => row.querySelector('td')?.textContent?.trim() ?? ''))
}

/**
 * Wait until the table holds more than `count` rows, returning whether it grew
 * within the budget instead of throwing — lets the caller decide how to react
 * (e.g. fall back to the explicit "Load more" control).
 */
async function rowsGrewBeyond(page: Page, count: number, timeout: number): Promise<boolean> {
  try {
    await expect
      .poll(() => page.locator(ROW_SELECTOR).count(), { timeout, intervals: [100] })
      .toBeGreaterThan(count)
    return true
  } catch {
    return false
  }
}

/**
 * Scroll the list's scrollable container down by roughly one viewport. The
 * patient list lives inside the main content area (`overflow-y-auto`), so we
 * walk up from the table to the same scrollable ancestor the app's infinite
 * scroll sentinel observes, mirroring `findScrollableAncestor` in the web app.
 */
async function scrollListStep(page: Page): Promise<void> {
  await page.evaluate(() => {
    const isScrollable = (el: Element) => {
      const oy = getComputedStyle(el).overflowY
      return oy === 'auto' || oy === 'scroll' || oy === 'overlay'
    }
    const anchor =
      document.querySelector('table[data-name="table"]') ??
      document.querySelector('[data-name="patient-card"]')
    let current: Element | null = anchor?.parentElement ?? null
    let container: HTMLElement | null = null
    while (current && current !== document.body && current !== document.documentElement) {
      if (isScrollable(current) && current.scrollHeight > current.clientHeight) {
        container = current as HTMLElement
        break
      }
      current = current.parentElement
    }
    const target: HTMLElement | Element =
      container ?? document.scrollingElement ?? document.documentElement
    const step = Math.max(('clientHeight' in target ? target.clientHeight : 600) * 0.9, 400)
    target.scrollTop += step
  })
}

test.describe('patient table (patient list)', () => {
  test('loads 77 patients and reaches all of them by scrolling, with no duplicate rows', async ({ page }) => {
    // Rendering 77 rows with their property columns and walking every page is
    // legitimately heavy; give it headroom over the default 30s test timeout.
    test.slow()
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })

    // 1) Load the root location (dashboard) first — it must render without
    //    crashing before we drill into the patient list.
    await page.goto(`${BASE}/`)
    await expect(page.locator('body')).toBeVisible()

    // 2) Navigate to the patient list.
    await page.goto(`${BASE}/patients`)

    // The list renders paged (a multiple of the page size), not all 77 at once —
    // proving the table genuinely loads incrementally rather than dumping the
    // whole dataset. (The sentinel may have already pulled a page or two by the
    // time we measure, so we only assert it is below the full total.)
    await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })
    await expect.poll(() => page.locator(ROW_SELECTOR).count(), { timeout: 20000 })
      .toBeGreaterThanOrEqual(1)
    const initialCount = await page.locator(ROW_SELECTOR).count()
    expect(initialCount).toBeLessThan(PATIENT_COUNT)
    expect(initialCount % PAGE_SIZE).toBe(0)

    // 3) Walk through every page by scrolling. The infinite-scroll sentinel
    //    (an IntersectionObserver with an 800px prefetch margin) loads the next
    //    page as the bottom approaches — there is no "Load more" button anymore.
    //    Each scroll step moves the container, which re-arms the observer, so a
    //    single missed tick is recovered by the next step.
    const seen = new Set<string>()
    const MAX_STEPS = 80
    let stagnant = 0

    for (let step = 0; step < MAX_STEPS; step++) {
      const names = await visibleRowNames(page)

      // No duplicates among the currently-rendered rows.
      expect(new Set(names).size).toBe(names.length)

      for (const name of names) seen.add(name)
      if (seen.size >= PATIENT_COUNT) break

      const before = await page.locator(ROW_SELECTOR).count()
      await scrollListStep(page)
      if (await rowsGrewBeyond(page, before, 1500)) {
        stagnant = 0
      } else {
        stagnant += 1
        // Many consecutive scrolls with no growth: the list is exhausted (or
        // genuinely stuck, which the assertion below surfaces).
        if (stagnant >= 8) break
      }
    }

    // 4) Final state: every one of the 77 patients was seen, and the fully
    //    loaded table holds exactly 77 unique rows.
    expect(seen.size).toBe(PATIENT_COUNT)

    const finalNames = await visibleRowNames(page)
    expect(finalNames.length).toBe(PATIENT_COUNT)
    expect(new Set(finalNames).size).toBe(PATIENT_COUNT)
  })

  test('card view windows the DOM: only a slice of cards is rendered while scrolling reaches every patient', async ({ page }) => {
    test.slow()
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
    // Start directly in the card layout (the toggle persists this key).
    await page.addInitScript(() => {
      window.localStorage.setItem('helpwave.tasks.listLayout:patients:/patients:root', 'card')
    })
    await mockBackend(page, {
      patients: PATIENTS,
      propertyDefinitions: [ALLERGY_DEF],
      rootLocations: ROOT_LOCATIONS,
    })

    await page.goto(`${BASE}/`)
    await expect(page.locator('body')).toBeVisible()
    await page.goto(`${BASE}/patients`)

    const CARD = '[data-name="patient-card"]'
    await expect(page.locator(CARD).first()).toBeVisible({ timeout: 20000 })

    // The last fixture patient (unique, zero-padded surname) proves the window
    // reached the bottom after loading every page.
    const lastPatient = page.locator(`${CARD}:has-text("Patient_${PATIENT_COUNT}")`)

    let maxRendered = 0
    const MAX_STEPS = 80
    let stagnant = 0
    for (let step = 0; step < MAX_STEPS; step++) {
      const rendered = await page.locator(CARD).count()
      maxRendered = Math.max(maxRendered, rendered)
      if (await lastPatient.count() > 0) break

      const before = await page.locator(CARD).count()
      await scrollListStep(page)
      await page.waitForTimeout(400)
      const after = await page.locator(CARD).count()
      // Progress = either new cards loaded (count changed) or the window moved.
      if (after !== before) {
        stagnant = 0
      } else {
        stagnant += 1
        if (stagnant >= 10) break
      }
    }

    // Reached the very last patient purely by scrolling (infinite scroll, no button).
    await expect(lastPatient).toBeVisible({ timeout: 5000 })

    // Windowing: the DOM never held anywhere near all patients at once. With 77
    // patients across a 1280x720 viewport only a viewport-sized slice (plus
    // overscan) is ever mounted, far below the full count.
    expect(maxRendered).toBeLessThan(PATIENT_COUNT - PAGE_SIZE)
  })
})
