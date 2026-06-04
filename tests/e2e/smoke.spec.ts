import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Smoke', () => {
  test('should render the document shell on the landing page', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('html')).toHaveCount(1);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should render on a mobile viewport', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should expose core entity routes without crashing', async ({ page, baseURL: configBaseURL }) => {
    const baseUrl = configBaseURL || baseURL;

    for (const path of ['/tasks', '/patients']) {
      const response = await page.goto(`${baseUrl}${path}`);
      await page.waitForLoadState('networkidle');

      if (response) {
        expect(response.status()).toBeLessThan(500);
      }
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
