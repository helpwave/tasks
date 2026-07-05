import { expect, type Page } from '@playwright/test'

export const ROW_SELECTOR = 'tr[data-name="table-body-row"]'

/** Text of the first visible cell of every rendered data row, in DOM order. */
export async function visibleRowFirstCells(page: Page): Promise<string[]> {
  return page.$$eval(ROW_SELECTOR, (rows) =>
    rows.map((row) => row.querySelector('td')?.textContent?.trim() ?? ''))
}

/** Text of the cell at `cellIndex` of every rendered data row, in DOM order. */
export async function visibleRowCells(page: Page, cellIndex: number): Promise<string[]> {
  return page.$$eval(
    `${ROW_SELECTOR}`,
    (rows, idx) => rows.map((row) => row.querySelectorAll('td')[idx as number]?.textContent?.trim() ?? ''),
    cellIndex
  )
}

export async function seedStoredSelection(page: Page, ids: string[]): Promise<void> {
  await page.addInitScript((selected) => {
    window.localStorage.setItem('selected-root-location-ids', JSON.stringify(selected))
  }, ids)
}

// ---------------------------------------------------------------------------
// toolbar panels
// ---------------------------------------------------------------------------

export async function openFilterPanel(page: Page): Promise<void> {
  await page.locator('button:visible', { hasText: /^Filter \(\d+\)/ }).first().click()
  await expect(page.getByRole('button', { name: 'Add filter' })).toBeVisible()
}

export async function openSortingPanel(page: Page): Promise<void> {
  await page.locator('button:visible', { hasText: /^Sorting \(\d+\)/ }).first().click()
  await expect(page.getByRole('button', { name: 'Add sorting' })).toBeVisible()
}

/**
 * Add a sort entry via the "Add sorting" combobox. The panel must be open.
 * The new entry starts ascending.
 */
export async function addSorting(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: 'Add sorting' }).click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

/**
 * Toggle an existing sort chip (identified by its label) to the given
 * direction using the ASC/DESC buttons in its popup.
 */
export async function setSortDirection(page: Page, label: string, direction: 'ASC' | 'DESC'): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.getByRole('button', { name: direction, exact: true }).click()
  await page.keyboard.press('Escape')
}

/** Remove a sort chip via the trash icon in its popup. */
export async function removeSorting(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.getByRole('button', { name: 'Remove filter' }).click()
}

function activeFilterPopup(page: Page) {
  return page.locator('[data-name="pop-up"]:visible, [role="dialog"]:visible').last()
}

/** Open the "Add filter" combobox and pick a field; leaves the filter popup open. */
export async function beginAddFilter(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: 'Add filter' }).click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

/** Commit the currently-open filter popup via its Done (check) button. */
export async function commitFilterPopup(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Done', exact: true }).click()
}

/**
 * Add a text filter (`contains` by default) for the given field.
 * The filter panel must be open.
 */
export async function addTextFilter(page: Page, label: string, text: string): Promise<void> {
  await beginAddFilter(page, label)
  await page.getByPlaceholder('Value').fill(text)
  await commitFilterPopup(page)
}

/**
 * Add a singleTag filter with the "equals" operator and pick one option.
 * The filter panel must be open.
 */
export async function addSingleTagEqualsFilter(page: Page, label: string, optionLabel: string): Promise<void> {
  await beginAddFilter(page, label)
  const dialog = page.getByRole('dialog').filter({ hasText: label })
  await dialog.locator('[data-name="filter-operator-select"]').click()
  await page.getByRole('option', { name: 'Equals', exact: true }).click()
  await dialog.getByRole('button', { name: /click to select/i }).click()
  const option = page.getByRole('option', { name: optionLabel, exact: true })
  if (await option.count() > 0) {
    await option.click()
  } else {
    await page.getByRole('option').first().click()
  }
  await commitFilterPopup(page)
}

/**
 * Add a tag filter (singleTag `contains` = multi select) and pick the given
 * options. The filter panel must be open.
 */
export async function addTagFilter(page: Page, label: string, optionLabels: string[]): Promise<void> {
  await beginAddFilter(page, label)
  const popup = activeFilterPopup(page)
  await popup.getByRole('button', { name: /Select/i }).first().click().catch(async () => {
    await popup.locator('button').first().click()
  })
  for (const option of optionLabels) {
    await page.getByRole('option', { name: option, exact: true }).click()
  }
  await page.keyboard.press('Escape')
  await commitFilterPopup(page)
}
