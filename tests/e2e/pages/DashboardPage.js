const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      // Header
      userInfo: '[data-testid="user-info"]',
      logoutButton: '[data-testid="logout-button"]',
      
      // Main actions
      addItemButton: '[data-testid="add-item-button"]',
      
      // Add Item Modal
      addItemModal: '[data-testid="add-item-modal"]',
      itemTypeSelect: '[data-testid="item-type-select"]',
      itemQuantityInput: '[data-testid="item-quantity-input"]',
      itemUnitSelect: '[data-testid="item-unit-select"]',
      itemLocationInput: '[data-testid="item-location-input"]',
      itemClientIdInput: '[data-testid="item-client-id-input"]',
      itemClientNameInput: '[data-testid="item-client-name-input"]',
      itemCollectionDateInput: '[data-testid="item-collection-date-input"]',
      submitNewItemButton: '[data-testid="submit-new-item"]',
      cancelAddItemButton: '[data-testid="cancel-add-item"]',
      
      // Edit Item Modal
      editItemModal: '[data-testid="edit-item-modal"]',
      editItemTypeSelect: '[data-testid="edit-item-type-select"]',
      editItemQuantityInput: '[data-testid="edit-item-quantity-input"]',
      editItemUnitSelect: '[data-testid="edit-item-unit-select"]',
      editItemLocationInput: '[data-testid="edit-item-location-input"]',
      editItemClientIdInput: '[data-testid="edit-item-client-id-input"]',
      editItemClientNameInput: '[data-testid="edit-item-client-name-input"]',
      editItemStatusSelect: '[data-testid="edit-item-status-select"]',
      editItemCollectionDateInput: '[data-testid="edit-item-collection-date-input"]',
      submitEditItemButton: '[data-testid="submit-edit-item"]',
      cancelEditItemButton: '[data-testid="cancel-edit-item"]',
      
      // Table
      itemsTable: '[data-testid="items-table"]',
      noItemsMessage: '[data-testid="no-items-message"]',
      
      // Statistics
      totalItemsCount: '[data-testid="total-items-count"]',
      pendingItemsCount: '[data-testid="pending-items-count"]',
      completedItemsCount: '[data-testid="completed-items-count"]'
    };
  }

  async goto() {
    await super.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async expectDashboardToBeVisible() {
    await this.expectToBeVisible(this.selectors.userInfo);
    await this.expectToBeVisible(this.selectors.addItemButton);
  }

  async expectUserInfo(username, role) {
    const userInfoText = await this.getText(this.selectors.userInfo);
    expect(userInfoText).toContain(username);
    expect(userInfoText).toContain(role);
  }

  async logout() {
    await this.clickElement(this.selectors.logoutButton);
  }

  // Add Item Operations
  async clickAddItemButton() {
    await this.clickElement(this.selectors.addItemButton);
  }

  async expectAddItemModalToBeVisible() {
    await this.expectToBeVisible(this.selectors.addItemModal);
  }

  async fillNewItemForm(itemData) {
    if (itemData.type) {
      await this.selectOption(this.selectors.itemTypeSelect, itemData.type);
    }
    if (itemData.quantity) {
      await this.fillInput(this.selectors.itemQuantityInput, itemData.quantity.toString());
    }
    if (itemData.unit) {
      await this.selectOption(this.selectors.itemUnitSelect, itemData.unit);
    }
    if (itemData.location) {
      await this.fillLocationInput(this.selectors.itemLocationInput, itemData.location);
    }
    if (itemData.clientId) {
      await this.fillInput(this.selectors.itemClientIdInput, itemData.clientId);
    }
    if (itemData.clientName) {
      await this.fillInput(this.selectors.itemClientNameInput, itemData.clientName);
    }
    if (itemData.collectionDate) {
      await this.fillInput(this.selectors.itemCollectionDateInput, itemData.collectionDate);
    }
  }

  async submitNewItem() {
    // Wait for form to be valid and button to be enabled
    const submitButton = this.page.locator(this.selectors.submitNewItemButton);
    
    // Wait for button to be visible and enabled
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.waitFor({ state: 'attached', timeout: 5000 });
    
    // Check if button is enabled (not disabled by form validation)
    const isEnabled = await submitButton.isEnabled();
    if (!isEnabled) {
      console.warn('Submit button is disabled, waiting for form validation...');
      await this.page.waitForTimeout(1000);
      
      // Wait for button to become enabled
      await submitButton.waitFor({ state: 'visible' });
      await this.page.waitForFunction(() => {
        const btn = document.querySelector('[data-testid="submit-new-item"]');
        return btn && !btn.disabled;
      }, { timeout: 10000 });
    }
    
    // Ensure button is stable before clicking
    await this.page.waitForTimeout(500);
    
    // Click with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await submitButton.click({ timeout: 10000 });
        break; // Success, exit loop
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('Failed to click submit button after maximum attempts');
          throw error;
        }
        console.log(`Submit button click failed, attempt ${attempts}/${maxAttempts}`);
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async cancelAddItem() {
    await this.clickElement(this.selectors.cancelAddItemButton);
  }

  async createNewItem(itemData) {
    await this.clickAddItemButton();
    await this.expectAddItemModalToBeVisible();
    await this.fillNewItemForm(itemData);
    await this.submitNewItem();
    
    // Wait for modal to close
    await this.expectToBeHidden(this.selectors.addItemModal);
  }

  // Edit Item Operations
  async clickEditItem(itemId) {
    const editButtonSelector = `[data-testid="edit-item-${itemId}"]`;
    await this.clickElement(editButtonSelector);
  }

  async expectEditItemModalToBeVisible() {
    await this.expectToBeVisible(this.selectors.editItemModal);
  }

  async fillEditItemForm(itemData) {
    if (itemData.type) {
      await this.selectOption(this.selectors.editItemTypeSelect, itemData.type);
    }
    if (itemData.quantity) {
      await this.fillInput(this.selectors.editItemQuantityInput, itemData.quantity.toString());
    }
    if (itemData.unit) {
      await this.selectOption(this.selectors.editItemUnitSelect, itemData.unit);
    }
    if (itemData.location) {
      await this.fillLocationInput(this.selectors.editItemLocationInput, itemData.location);
    }
    if (itemData.clientId) {
      await this.fillInput(this.selectors.editItemClientIdInput, itemData.clientId);
    }
    if (itemData.clientName) {
      await this.fillInput(this.selectors.editItemClientNameInput, itemData.clientName);
    }
    if (itemData.status) {
      await this.selectOption(this.selectors.editItemStatusSelect, itemData.status);
    }
    if (itemData.collectionDate) {
      await this.fillInput(this.selectors.editItemCollectionDateInput, itemData.collectionDate);
    }
  }

  async submitEditItem() {
    await this.clickElement(this.selectors.submitEditItemButton);
  }

  async cancelEditItem() {
    await this.clickElement(this.selectors.cancelEditItemButton);
  }

  async editItem(itemId, itemData) {
    await this.clickEditItem(itemId);
    await this.expectEditItemModalToBeVisible();
    await this.fillEditItemForm(itemData);
    await this.submitEditItem();
    
    // Wait for modal to close
    await this.expectToBeHidden(this.selectors.editItemModal);
  }

  // Delete Item Operations
  async clickDeleteItem(itemId) {
    const deleteButtonSelector = `[data-testid="delete-item-${itemId}"]`;
    
    try {
      // First check if the delete button exists and is visible
      await this.page.waitForSelector(deleteButtonSelector, { timeout: 5000 });
      
      // Set up dialog handler before clicking
      const dialogPromise = new Promise((resolve) => {
        this.page.once('dialog', async (dialog) => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain('Are you sure');
          await dialog.accept();
          resolve();
        });
      });
      
      // Click delete button
      await this.clickElement(deleteButtonSelector);
      
      // Wait for dialog to be handled
      await dialogPromise;
      
      // Wait for the DELETE API request to complete
      await this.page.waitForResponse(response => 
        response.url().includes(`/api/items/${itemId}`) && 
        response.request().method() === 'DELETE' &&
        response.status() === 200,
        { timeout: 10000 }
      );
      
      // Wait for the table to update (item row to be removed)
      await this.page.waitForFunction(
        (itemId) => {
          const itemRow = document.querySelector(`[data-testid="item-row-${itemId}"]`);
          return !itemRow;
        },
        itemId,
        { timeout: 5000 }
      );
      
      // Additional wait to ensure UI has fully updated
      await this.page.waitForTimeout(500);
      
    } catch (error) {
      console.error(`Error deleting item ${itemId}:`, error);
      throw error;
    }
  }

  async clickDeleteItemAndCancel(itemId) {
    const deleteButtonSelector = `[data-testid="delete-item-${itemId}"]`;
    
    try {
      // First check if the delete button exists and is visible
      await this.page.waitForSelector(deleteButtonSelector, { timeout: 5000 });
      
      // Handle the confirmation dialog and cancel
      this.page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Are you sure');
        await dialog.dismiss();
      });
      
      await this.clickElement(deleteButtonSelector);
    } catch (error) {
      console.error(`Error canceling delete for item ${itemId}:`, error);
      throw error;
    }
  }

  // Helper method to get the first available item ID from the table
  async getFirstItemId() {
    try {
      const itemRows = this.page.locator('[data-testid^="item-row-"]');
      const count = await itemRows.count();
      
      if (count === 0) {
        throw new Error('No items found in table');
      }
      
      const firstRow = itemRows.first();
      const testId = await firstRow.getAttribute('data-testid');
      const itemId = testId.replace('item-row-', '');
      
      return itemId;
    } catch (error) {
      console.error('Error getting first item ID:', error);
      throw error;
    }
  }

  async getAllItemIds() {
    try {
      const itemRows = this.page.locator('[data-testid^="item-row-"]');
      const count = await itemRows.count();
      const itemIds = [];
      
      for (let i = 0; i < count; i++) {
        const row = itemRows.nth(i);
        const testId = await row.getAttribute('data-testid');
        const itemId = testId.replace('item-row-', '');
        itemIds.push(itemId);
      }
      
      return itemIds;
    } catch (error) {
      console.error('Error getting all item IDs:', error);
      return [];
    }
  }

  async deleteFirstAvailableItem() {
    try {
      // Wait for table to be loaded first
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);
      
      const itemId = await this.getFirstItemId();
      console.log(`Attempting to delete item with ID: ${itemId}`);
      
      await this.clickDeleteItem(itemId);
      
      // Wait longer for backend processing and UI update
      await this.page.waitForTimeout(2000);
      
      // Verify the item was actually deleted
      const itemExists = await this.page.locator(`[data-testid="item-row-${itemId}"]`).isVisible().catch(() => false);
      if (itemExists) {
        console.warn(`Item ${itemId} still visible after delete operation`);
        // Wait a bit more and check again
        await this.page.waitForTimeout(2000);
      }
      
      return itemId;
    } catch (error) {
      console.error('Error deleting first available item:', error);
      throw error;
    }
  }

  async expectItemInTable(itemId) {
    const itemRowSelector = `[data-testid="item-row-${itemId}"]`;
    await this.expectToBeVisible(itemRowSelector);
  }

  async expectItemNotInTable(itemId) {
    const itemRowSelector = `[data-testid="item-row-${itemId}"]`;
    await this.expectToBeHidden(itemRowSelector);
  }

  async expectTableToBeVisible() {
    await this.expectToBeVisible(this.selectors.itemsTable);
  }

  async expectNoItemsMessage() {
    await this.expectToBeHidden(this.selectors.itemsTable);
    // Expect empty state message
    const emptyStateText = 'No waste items';
    await expect(this.page.locator('text=' + emptyStateText)).toBeVisible();
  }

  async getItemsCount() {
    const rows = await this.page.locator(this.selectors.itemsTable + ' tbody tr').count();
    return rows;
  }

  async getItemCount() {
    return await this.getItemsCount();
  }

  async expectItemsCount(expectedCount) {
    const actualCount = await this.getItemsCount();
    expect(actualCount).toBe(expectedCount);
  }

  async getItemRowData(itemId) {
    const itemRowSelector = `[data-testid="item-row-${itemId}"]`;
    const row = this.page.locator(itemRowSelector);
    
    const data = {
      type: await row.locator('td:nth-child(1)').textContent(),
      quantity: await row.locator('td:nth-child(2)').textContent(),
      location: await row.locator('td:nth-child(3)').textContent(),
      client: await row.locator('td:nth-child(4)').textContent(),
      collectionDate: await row.locator('td:nth-child(5)').textContent(),
      status: await row.locator('td:nth-child(6)').textContent()
    };
    
    return data;
  }

  async expectItemRowData(itemId, expectedData) {
    const actualData = await this.getItemRowData(itemId);
    
    if (expectedData.type) {
      expect(actualData.type).toContain(expectedData.type);
    }
    if (expectedData.quantity) {
      expect(actualData.quantity).toContain(expectedData.quantity.toString());
    }
    if (expectedData.location) {
      expect(actualData.location).toContain(expectedData.location);
    }
    if (expectedData.clientName) {
      expect(actualData.client).toContain(expectedData.clientName);
    }
    if (expectedData.clientId) {
      expect(actualData.client).toContain(expectedData.clientId);
    }
    if (expectedData.status) {
      expect(actualData.status).toContain(expectedData.status);
    }
  }

  async expectStatistics(stats) {
    if (stats.total !== undefined) {
      await this.expectToContainText(this.selectors.totalItemsCount, stats.total.toString());
    }
    if (stats.pending !== undefined) {
      await this.expectToContainText(this.selectors.pendingItemsCount, stats.pending.toString());
    }
    if (stats.completed !== undefined) {
      await this.expectToContainText(this.selectors.completedItemsCount, stats.completed.toString());
    }
  }

  async expectErrorMessage(message) {
    const errorSelector = '.bg-red-50'; // Error message styling
    await this.expectToBeVisible(errorSelector);
    await this.expectToContainText(errorSelector, message);
  }

  async expectNoErrorMessage() {
    const errorSelector = '.bg-red-50';
    await this.expectToBeHidden(errorSelector);
  }

  async expectFormFieldError(fieldSelector, errorMessage) {
    // Check if field has error styling or validation message
    const field = this.page.locator(fieldSelector);
    await expect(field).toHaveClass(/error|invalid/);
  }

  async expectRequiredFieldValidation(fieldSelector) {
    const field = this.page.locator(fieldSelector);
    await expect(field).toHaveAttribute('required');
  }

  async expectModalToBeHidden(modalSelector) {
    await this.expectToBeHidden(modalSelector);
  }

  async closeModalByClickingOutside(modalSelector) {
    // Click outside the modal to close it
    await this.page.click('body', { position: { x: 10, y: 10 } });
    await this.expectToBeHidden(modalSelector);
  }

  async expectLoadingState() {
    const loadingSelector = '.animate-spin';
    await this.expectToBeVisible(loadingSelector);
  }

  async expectLoadingStateToEnd() {
    const loadingSelector = '.animate-spin';
    await this.expectToBeHidden(loadingSelector);
  }

  async expectToBeOnDashboard() {
    await this.expectURL(/.*\/dashboard/);
    await this.expectDashboardToBeVisible();
  }

  getTestItemData() {
    return {
      type: 'General Waste',
      quantity: 100,
      unit: 'kg',
      location: 'Test Location',
      clientId: 'TEST001',
      clientName: 'Test Client',
      collectionDate: '2024-12-31'
    };
  }

  getEditedItemData() {
    return {
      type: 'Recycling',
      quantity: 150,
      unit: 'tonnes',
      location: 'Updated Test Location',
      clientId: 'EDIT001',
      clientName: 'Updated Test Client',
      collectionDate: '2024-12-25',
      status: 'completed'
    };
  }

  async createMultipleItems(itemsData) {
    for (const itemData of itemsData) {
      await this.createNewItem(itemData);
      // Small delay between creations
      await this.page.waitForTimeout(500);
    }
  }

  async expectMultipleItemsInTable(itemIds) {
    for (const itemId of itemIds) {
      await this.expectItemInTable(itemId);
    }
  }

  async searchItems(searchTerm) {
    const searchSelector = '[data-testid="search-input"]';
    if (await this.isVisible(searchSelector)) {
      await this.fillInput(searchSelector, searchTerm);
    }
  }

  async filterByType(type) {
    const filterSelector = '[data-testid="type-filter"]';
    if (await this.isVisible(filterSelector)) {
      await this.selectOption(filterSelector, type);
    }
  }

  async filterByStatus(status) {
    const filterSelector = '[data-testid="status-filter"]';
    if (await this.isVisible(filterSelector)) {
      await this.selectOption(filterSelector, status);
    }
  }

  // Specialized method for location input to prevent spam
  async fillLocationInput(selector, value) {
    try {
      console.log(`Filling location input with: "${value}"`);
      const inputElement = this.page.locator(selector);
      
      // Wait for element to be visible and enabled
      await inputElement.waitFor({ state: 'visible', timeout: 10000 });
      await inputElement.waitFor({ state: 'attached', timeout: 5000 });
      
      // Focus the input first
      await inputElement.focus();
      await this.page.waitForTimeout(200);
      
      // Clear existing content more efficiently
      await inputElement.selectText();
      await this.page.waitForTimeout(100);
      
      // Use fill() method for better performance instead of type()
      await inputElement.fill(value);
      await this.page.waitForTimeout(300);
      
      // Verify the value was set correctly
      const finalValue = await inputElement.inputValue();
      console.log(`Location input final value: "${finalValue}"`);
      
      if (finalValue !== value) {
        console.warn(`Location input mismatch! Expected: "${value}", Got: "${finalValue}"`);
        // Retry with direct JavaScript assignment if fill() didn't work
        await inputElement.evaluate((el, val) => {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, value);
        
        // Final verification
        const retryValue = await inputElement.inputValue();
        if (retryValue !== value) {
          throw new Error(`Failed to set location input value. Expected: "${value}", Got: "${retryValue}"`);
        }
      }
      
    } catch (error) {
      console.error(`Error filling location input with "${value}":`, error);
      throw error;
    }
  }
}

module.exports = DashboardPage;