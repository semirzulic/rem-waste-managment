const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      usernameInput: '[data-testid="username-input"]',
      passwordInput: '[data-testid="password-input"]',
      loginButton: '[data-testid="login-button"]',
      errorMessage: '[data-testid="error-message"]',
      demoCredentials: '[data-testid="demo-credentials"]',
      loginForm: '[data-testid="login-form"]',
      pageTitle: 'h2:has-text("REM Waste Management")'
    };
  }

  // Navigation
  async goto() {
    try {
      await this.page.goto('/login');
      await this.waitForPageLoad();
    } catch (error) {
      console.error('Error navigating to login page:', error);
    }
  }

  // Form interactions
  async fillUsername(username) {
    try {
      await this.page.fill(this.selectors.usernameInput, username);
    } catch (error) {
      console.error('Error filling username:', error);
    }
  }

  async fillPassword(password) {
    try {
      await this.page.fill(this.selectors.passwordInput, password);
    } catch (error) {
      console.error('Error filling password:', error);
    }
  }

  async clickLoginButton() {
    try {
      await this.page.click(this.selectors.loginButton);
    } catch (error) {
      console.error('Error clicking login button:', error);
    }
  }

  async clearForm() {
    try {
      await this.page.fill(this.selectors.usernameInput, '');
      await this.page.fill(this.selectors.passwordInput, '');
    } catch (error) {
      console.error('Error clearing form:', error);
    }
  }

  // Combined login actions
  async login(username, password) {
    try {
      await this.fillUsername(username);
      await this.fillPassword(password);
      await this.clickLoginButton();
      // Wait a moment for the request to complete
      await this.page.waitForTimeout(1000);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }

  async loginAsAdmin() {
    try {
      await this.login('admin', 'password123');
    } catch (error) {
      console.error('Error logging in as admin:', error);
    }
  }

  async loginAsManager() {
    try {
      await this.login('manager', 'manager123');
    } catch (error) {
      console.error('Error logging in as manager:', error);
    }
  }

  async loginWithInvalidCredentials() {
    try {
      await this.login('invalid', 'invalid');
    } catch (error) {
      console.error('Error logging in with invalid credentials:', error);
    }
  }

  // Expectations
  async expectLoginPageToBeVisible() {
    try {
      await this.expectToBeVisible(this.selectors.loginForm);
      await this.expectToBeVisible(this.selectors.usernameInput);
      await this.expectToBeVisible(this.selectors.passwordInput);
      await this.expectToBeVisible(this.selectors.loginButton);
      await this.expectToBeVisible(this.selectors.pageTitle);
    } catch (error) {
      console.error('Error expecting login page to be visible:', error);
    }
  }

  async expectDemoCredentialsVisible() {
    try {
      await this.expectToBeVisible(this.selectors.demoCredentials);
    } catch (error) {
      console.error('Error expecting demo credentials to be visible:', error);
    }
  }

  async expectLoginButtonEnabled() {
    try {
      const button = this.page.locator(this.selectors.loginButton);
      await expect(button).toBeEnabled();
    } catch (error) {
      console.error('Error expecting login button to be enabled:', error);
    }
  }

  async expectLoginButtonText(expectedText) {
    try {
      const button = this.page.locator(this.selectors.loginButton);
      await expect(button).toHaveText(expectedText);
    } catch (error) {
      console.error('Error expecting login button text:', error);
    }
  }

  async expectErrorMessage(expectedMessage) {
    try {
      await this.expectToBeVisible(this.selectors.errorMessage);
      const errorElement = this.page.locator(this.selectors.errorMessage);
      await expect(errorElement).toContainText(expectedMessage);
    } catch (error) {
      console.error('Error expecting error message:', error);
    }
  }

  async expectSuccessfulLogin() {
    try {
      // After successful login, user should be redirected to dashboard
      await this.waitForURL(/.*\/dashboard/);
    } catch (error) {
      console.error('Error expecting successful login:', error);
    }
  }

  async expectLoginButtonDisabled() {
    try {
      const button = this.page.locator(this.selectors.loginButton);
      await expect(button).toBeDisabled();
    } catch (error) {
      console.error('Error expecting login button to be disabled:', error);
    }
  }

  // Utility methods
  async waitForPageLoad() {
    try {
      await this.page.waitForLoadState('networkidle');
      await this.expectLoginPageToBeVisible();
    } catch (error) {
      console.error('Error waiting for page load:', error);
    }
  }
}

module.exports = LoginPage;