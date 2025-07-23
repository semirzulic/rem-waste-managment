const { test, expect } = require('@playwright/test');
const LoginPage = require('../e2e/pages/LoginPage');
const DashboardPage = require('../e2e/pages/DashboardPage');

test.describe('Visual Regression Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to login page first
    await loginPage.goto();
    
    // Clear any existing auth data
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore localStorage errors
      }
    });
    
    // Login and wait for dashboard
    await loginPage.loginAsAdmin();
    await dashboardPage.expectToBeOnDashboard();
    await page.waitForLoadState('networkidle');
  });

  test('should match dashboard layout snapshot', async ({ page }) => {
    // Take screenshot of full dashboard
    await expect(page).toHaveScreenshot('dashboard-full.png');
  });

  test('should match items table snapshot', async ({ page }) => {
    // Focus on the items table
    const table = page.locator('[data-testid="items-table"]');
    await expect(table).toHaveScreenshot('items-table.png');
  });

  test('should match add item modal snapshot', async ({ page }) => {
    // Open add item modal
    await dashboardPage.clickAddItemButton();
    await dashboardPage.expectAddItemModalToBeVisible();
    
    // Take screenshot of modal
    const modal = page.locator('[data-testid="add-item-modal"]');
    await expect(modal).toHaveScreenshot('add-item-modal.png');
  });

  test('should match login page snapshot', async ({ page }) => {
    // Navigate to login page
    await dashboardPage.logout();
    await loginPage.expectLoginPageToBeVisible();
    
    // Take screenshot of login page
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('should match mobile dashboard layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard to be ready after reload
    await dashboardPage.expectToBeOnDashboard();
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
