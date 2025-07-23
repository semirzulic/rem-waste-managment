const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const DashboardPage = require('./pages/DashboardPage');

test.describe('Login Functionality', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Navigate to login page first
    await loginPage.goto();
    
    // Clear any existing auth data after page is loaded
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in some browsers
      }
    });
  });

  test.describe('Valid Login Scenarios', () => {
    test('should login successfully with admin credentials', async () => {
      await test.step('Verify login page is displayed', async () => {
        await loginPage.expectLoginPageToBeVisible();
        await loginPage.expectDemoCredentialsVisible();
      });

      await test.step('Login with admin credentials', async () => {
        await loginPage.loginAsAdmin();
      });

      await test.step('Verify successful login and redirect to dashboard', async () => {
        await loginPage.expectSuccessfulLogin();
        await dashboardPage.expectToBeOnDashboard();
        await dashboardPage.expectUserInfo('admin', 'admin');
      });
    });

    test('should login successfully with manager credentials', async () => {
      await test.step('Login with manager credentials', async () => {
        await loginPage.loginAsManager();
      });

      await test.step('Verify successful login', async () => {
        await loginPage.expectSuccessfulLogin();
        await dashboardPage.expectToBeOnDashboard();
        await dashboardPage.expectUserInfo('manager', 'manager');
      });
    });

    test('should remember login state after page refresh', async () => {
      await loginPage.loginAsAdmin();
      await dashboardPage.expectToBeOnDashboard();
      
      // Refresh the page
      await loginPage.page.reload();
      
      // Should still be on dashboard
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectUserInfo('admin', 'admin');
    });
  });

  test.describe('Invalid Login Scenarios', () => {
    test('should show error with invalid username', async () => {
      await test.step('Attempt login with invalid username', async () => {
        await loginPage.login('invaliduser', 'password123');
      });

      await test.step('Verify error message is displayed', async () => {
        await loginPage.expectErrorMessage('Invalid credentials');
      });

      await test.step('Verify user remains on login page', async () => {
        await loginPage.expectLoginPageToBeVisible();
      });
    });

    test('should show error with invalid password', async () => {
      await test.step('Attempt login with invalid password', async () => {
        await loginPage.login('admin', 'wrongpassword');
      });

      await test.step('Verify error message is displayed', async () => {
        await loginPage.expectErrorMessage('Invalid credentials');
      });
    });

    test('should show error with empty credentials', async () => {
      await test.step('Attempt login with empty fields', async () => {
        await loginPage.clickLoginButton();
      });

      await test.step('Verify form validation prevents submission', async () => {
        await loginPage.expectLoginPageToBeVisible();
        // Form should not submit due to HTML5 validation
      });
    });

    test('should show error with empty username', async () => {
      await test.step('Fill only password field', async () => {
        await loginPage.fillPassword('password123');
        await loginPage.clickLoginButton();
      });

      await test.step('Verify form validation', async () => {
        await loginPage.expectLoginPageToBeVisible();
      });
    });

    test('should show error with empty password', async () => {
      await test.step('Fill only username field', async () => {
        await loginPage.fillUsername('admin');
        await loginPage.clickLoginButton();
      });

      await test.step('Verify form validation', async () => {
        await loginPage.expectLoginPageToBeVisible();
      });
    });
  });

  test.describe('UI Elements and Interactions', () => {
    test('should display all required UI elements', async () => {
      await loginPage.expectLoginPageToBeVisible();
      await loginPage.expectDemoCredentialsVisible();
      await loginPage.expectLoginButtonEnabled();
    });

    test('should show loading state during login', async () => {
      await loginPage.fillUsername('admin');
      await loginPage.fillPassword('password123');
      
      // Click login and immediately check for loading state
      await loginPage.clickLoginButton();
      await loginPage.expectLoginButtonText('Signing in...');
    });

    test('should clear form after failed login attempt', async () => {
      await loginPage.login('invalid', 'invalid');
      await loginPage.expectErrorMessage('Invalid credentials');
      
      // Clear form and try again
      await loginPage.clearForm();
      await loginPage.loginAsAdmin();
      await dashboardPage.expectToBeOnDashboard();
    });
  });

  test.describe('Logout Functionality', () => {
    test('should logout successfully and redirect to login', async () => {
      await test.step('Login first', async () => {
        await loginPage.loginAsAdmin();
        await dashboardPage.expectToBeOnDashboard();
      });

      await test.step('Logout', async () => {
        await dashboardPage.logout();
      });

      await test.step('Verify redirect to login page', async () => {
        await loginPage.expectLoginPageToBeVisible();
      });

      await test.step('Verify auth data is cleared', async () => {
        const token = await loginPage.page.evaluate(() => {
          try {
            return localStorage.getItem('token');
          } catch (e) {
            return null;
          }
        });
        const user = await loginPage.page.evaluate(() => {
          try {
            return localStorage.getItem('user');
          } catch (e) {
            return null;
          }
        });
        expect(token).toBeNull();
        expect(user).toBeNull();
      });
    });

    test('should prevent access to dashboard after logout', async () => {
      // Login first
      await loginPage.loginAsAdmin();
      await dashboardPage.expectToBeOnDashboard();
      
      // Logout
      await dashboardPage.logout();
      await loginPage.expectLoginPageToBeVisible();
      
      // Try to access dashboard directly
      await dashboardPage.goto();
      
      // Should be redirected back to login
      await loginPage.expectLoginPageToBeVisible();
    });
  });
});
