import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Authentication', () => {
  test('should display login page', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await expect(page).toHaveTitle(/tasks/i);
  });

  test('should handle authentication flow', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle unauthenticated access gracefully', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(1000);
    expect(errors.length).toBeLessThanOrEqual(0);
  });

  test('should have proper page metadata', async ({ page, baseURL: configBaseURL }) => {
    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should load without console errors', async ({ page, baseURL: configBaseURL }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const url = configBaseURL || baseURL;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('favicon') && !error.includes('404')
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(0);
  });
});


