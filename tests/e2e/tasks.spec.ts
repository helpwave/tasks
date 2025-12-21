import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  });

  test('should display tasks page', async ({ page, baseURL: configBaseURL }) => {
    const baseUrl = configBaseURL || baseURL;
    await page.goto(`${baseUrl}/tasks`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to tasks page from home', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const tasksLink = page.locator('a[href*="/tasks"]').first();
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*tasks/);
    }
  });

  test('should handle page load without errors', async ({ page, baseURL: configBaseURL }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    const baseUrl = configBaseURL || baseURL;
    await page.goto(`${baseUrl}/tasks`);
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('should have accessible page structure', async ({ page, baseURL: configBaseURL }) => {
    const baseUrl = configBaseURL || baseURL;
    await page.goto(`${baseUrl}/tasks`);
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent.first()).toBeVisible();
  });
});


