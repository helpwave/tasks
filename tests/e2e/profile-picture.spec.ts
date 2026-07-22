import { test, expect, type Page } from '@playwright/test'
import { mockBackend, seedAuth } from './support/mockBackend'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const ROOT_LOCATIONS = [{ id: 'root-1', title: 'General Hospital', kind: 'CLINIC' }]

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

async function seedStoredSelection(page: Page, ids: string[]) {
  await page.addInitScript((selected) => {
    window.localStorage.setItem('selected-root-location-ids', JSON.stringify(selected))
  }, ids)
}

async function openSettings(page: Page) {
  await page.goto(`${BASE}/settings`)
  const profileSection = page.getByRole('main')
  await expect(profileSection.getByText('Test User', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(profileSection.getByRole('button', { name: 'Upload Picture' })).toBeVisible()
}

test.describe('profile picture settings', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await seedStoredSelection(page, ['root-1'])
  })

  test('selecting an image shows a preview and Save, and remove clears it', async ({ page }) => {
    await mockBackend(page, { patients: [], rootLocations: ROOT_LOCATIONS })
    await openSettings(page)

    const profileSection = page.getByRole('main')
    await profileSection.locator('#profile-picture-upload').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })

    await expect(profileSection.getByRole('button', { name: 'Change Picture' })).toBeVisible()
    await expect(profileSection.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(profileSection.getByRole('button', { name: 'Remove selected image' })).toBeVisible()

    await profileSection.getByRole('button', { name: 'Remove selected image' }).click()
    await expect(profileSection.getByRole('button', { name: 'Upload Picture' })).toBeVisible()
    await expect(profileSection.getByRole('button', { name: 'Save' })).toHaveCount(0)
  })

  test('saving an upload updates the avatar url after refetch', async ({ page }) => {
    const handle = await mockBackend(page, { patients: [], rootLocations: ROOT_LOCATIONS })
    const avatarUrl = `/api/profile/user-1?v=1710000000000`

    await page.route('**/api/profile/upload', async (route) => {
      handle.setAvatarUrl(avatarUrl)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, avatarUrl }),
      })
    })

    await openSettings(page)

    const profileSection = page.getByRole('main')
    await profileSection.locator('#profile-picture-upload').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })
    await profileSection.getByRole('button', { name: 'Save' }).click()

    await expect(profileSection.getByRole('button', { name: 'Upload Picture' })).toBeVisible({ timeout: 10000 })
    await expect(profileSection.getByRole('button', { name: 'Save' })).toHaveCount(0)
    expect(handle.getAvatarUrl()).toBe(avatarUrl)

    await expect
      .poll(() => handle.operations.filter(op => op.name === 'GetGlobalData').length)
      .toBeGreaterThan(1)
  })
})
