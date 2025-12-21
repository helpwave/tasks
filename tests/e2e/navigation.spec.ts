import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between pages', async ({ page }) => {
    const pages = ['/tasks', '/patients', '/properties'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should maintain state during navigation', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*\/$/);
  });
});

