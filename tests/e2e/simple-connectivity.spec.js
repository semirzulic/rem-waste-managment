const { test, expect } = require('@playwright/test');

test('Simple connectivity check', async ({ page }) => {
  console.log('=== CONNECTIVITY TEST START ===');
  
  try {
    console.log('1. Navigating to http://localhost:3000/login');
    await page.goto('http://localhost:3000/login', { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    console.log('2. Page loaded, checking URL');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    console.log('3. Getting page title');
    const title = await page.title();
    console.log('Page title:', title);
    
    console.log('4. Checking if page has content');
    const bodyText = await page.textContent('body');
    console.log('Body content length:', bodyText.length);
    console.log('First 100 chars:', bodyText.substring(0, 100));
    
    console.log('5. Looking for login form');
    const loginFormExists = await page.locator('[data-testid="login-form"]').count();
    console.log('Login form elements found:', loginFormExists);
    
    if (loginFormExists === 0) {
      console.log('6. Login form not found, checking all test IDs');
      const allTestIds = await page.locator('[data-testid]').count();
      console.log('Total elements with data-testid:', allTestIds);
      
      // Get all test IDs present
      const elements = await page.locator('[data-testid]').all();
      for (let i = 0; i < Math.min(elements.length, 5); i++) {
        const testId = await elements[i].getAttribute('data-testid');
        console.log(`Found test-id: ${testId}`);
      }
    }
    
    console.log('7. Taking screenshot for debugging');
    await page.screenshot({ path: 'connectivity-debug.png' });
    
    console.log('=== CONNECTIVITY TEST END ===');
    
    // Only fail if we can't reach the page at all
    expect(bodyText.length).toBeGreaterThan(0);
    
  } catch (error) {
    console.error('CONNECTIVITY ERROR:', error.message);
    throw error;
  }
});
