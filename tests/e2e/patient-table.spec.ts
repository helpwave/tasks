import { test, expect, type Page } from '@playwright/test'
import { mockBackend, seedAuth, type PatientFixture } from './support/mockBackend'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [
  { id: 'root-1', title: 'General Hospital', kind: 'CLINIC' },
]

const ALLERGY_DEF = { id: 'def-allergy', name: 'Allergy', fieldType: 'FIELD_TYPE_TEXT', options: [] }

const PATIENT_COUNT = 77

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
    const table = document.querySelector('table[data-name="table"]')
    let current: Element | null = table?.parentElement ?? null
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

    // The table is virtualized: only the rows near the viewport are mounted, so
    // the DOM never holds the whole dataset at once.
    await expect(page.locator(ROW_SELECTOR).first()).toBeVisible({ timeout: 20000 })
    await expect.poll(() => page.locator(ROW_SELECTOR).count(), { timeout: 20000 })
      .toBeGreaterThanOrEqual(1)
    expect(await page.locator(ROW_SELECTOR).count()).toBeLessThan(PATIENT_COUNT)

    // Scroll the list's own container to the bottom. Every patient must window
    // into view at some point (with no duplicates while rendered), which proves
    // both that scroll-driven loading reaches the whole dataset and that the
    // table is genuinely virtualized (the DOM never holds all 77 rows together).
    const seen = new Set<string>()
    let maxRenderedRows = 0
    let stalls = 0
    const deadline = Date.now() + 45000

    while (seen.size < PATIENT_COUNT && stalls < 6 && Date.now() < deadline) {
      const names = await visibleRowNames(page)
      expect(new Set(names).size).toBe(names.length)
      maxRenderedRows = Math.max(maxRenderedRows, names.length)
      const sizeBefore = seen.size
      for (const name of names) seen.add(name)
      if (seen.size >= PATIENT_COUNT) break
      await scrollListStep(page)
      await page.waitForTimeout(350)
      stalls = seen.size === sizeBefore ? stalls + 1 : 0
    }

    expect(seen.size).toBe(PATIENT_COUNT)
    expect(maxRenderedRows).toBeLessThan(PATIENT_COUNT)
  })
})
