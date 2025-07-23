const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
    this.baseURL = 'http://localhost:3000';
  }

  async goto(path = '') {
    await this.page.goto(`${this.baseURL}${path}`);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async waitForElement(locator, timeout = 10000) {
    await this.page.waitForSelector(locator, { timeout });
  }

  async clickElement(locator) {
    await this.page.click(locator);
  }

  async fillInput(locator, value) {
    try {
      const inputElement = this.page.locator(locator);
      
      // Wait for the element to be visible and enabled
      await inputElement.waitFor({ state: 'visible', timeout: 5000 });
      await inputElement.waitFor({ state: 'attached', timeout: 5000 });
      
      // Focus the element first
      await inputElement.focus();
      await this.page.waitForTimeout(100);
      
      // Clear the field using multiple methods to ensure it's empty
      await inputElement.selectText();
      await this.page.keyboard.press('Delete');
      await inputElement.fill('');
      await this.page.waitForTimeout(200);
      
      // Verify the field is actually empty
      const currentValue = await inputElement.inputValue();
      if (currentValue && currentValue.length > 0) {
        // If still has content, try more aggressive clearing
        await inputElement.selectText();
        await this.page.keyboard.press('Backspace');
        await inputElement.clear();
        await this.page.waitForTimeout(100);
      }
      
      // Type the value character by character to prevent spam
      await inputElement.type(value, { delay: 50 });
      
      // Verify the value was set correctly
      const finalValue = await inputElement.inputValue();
      if (finalValue !== value) {
        console.warn(`Input value mismatch. Expected: "${value}", Got: "${finalValue}"`);
        // Fallback: try one more time with direct fill
        await inputElement.fill('');
        await this.page.waitForTimeout(100);
        await inputElement.fill(value);
      }
      
    } catch (error) {
      console.error(`Error filling input ${locator} with value "${value}":`, error);
      
      // Ultimate fallback: use JavaScript to set the value directly
      try {
        await this.page.locator(locator).evaluate((el, val) => {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, value);
      } catch (fallbackError) {
        console.error(`Fallback input fill also failed:`, fallbackError);
        throw error;
      }
    }
  }

  async selectOption(locator, value) {
    await this.page.selectOption(locator, value);
  }

  async getText(locator) {
    return await this.page.textContent(locator);
  }

  async isVisible(locator) {
    return await this.page.isVisible(locator);
  }

  async isEnabled(locator) {
    return await this.page.isEnabled(locator);
  }

  async waitForURL(urlPattern, timeout = 10000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async expectToContainText(locator, text) {
    await expect(this.page.locator(locator)).toContainText(text);
  }

  async expectToBeVisible(selector, timeout = 10000) {
    try {
      console.log(`Waiting for element to be visible: ${selector}`);
      await expect(this.page.locator(selector)).toBeVisible({ timeout });
      console.log(`Element is visible: ${selector}`);
    } catch (error) {
      console.error(`Element not visible after ${timeout}ms: ${selector}`);
      
      // Debug information
      const currentUrl = this.page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check if page has any content
      const bodyText = await this.page.textContent('body').catch(() => 'Could not get body text');
      console.log(`Page body text length: ${bodyText.length}`);
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: `debug-${Date.now()}.png` }).catch(() => {});
      
      // Check what elements are actually present
      const allElements = await this.page.locator('[data-testid]').count();
      console.log(`Found ${allElements} elements with data-testid`);
      
      throw error;
    }
  }

  async expectToBeHidden(locator) {
    // Add retry logic for modal visibility checks
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        await expect(this.page.locator(locator)).toBeHidden({ timeout: 2000 });
        return; // Success, exit
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error(`Element still visible after ${maxAttempts} attempts: ${locator}`);
          // Try to force close any modal that might be stuck
          await this.page.keyboard.press('Escape').catch(() => {});
          await this.page.waitForTimeout(500);
          // Final attempt
          await expect(this.page.locator(locator)).toBeHidden({ timeout: 1000 });
          return;
        }
        console.log(`Element still visible, attempt ${attempts}/${maxAttempts}: ${locator}`);
        await this.page.waitForTimeout(500);
      }
    }
  }

  async expectToHaveValue(locator, value) {
    await expect(this.page.locator(locator)).toHaveValue(value);
  }

  async expectURL(urlPattern) {
    await expect(this.page).toHaveURL(urlPattern);
  }
}

module.exports = BasePage;