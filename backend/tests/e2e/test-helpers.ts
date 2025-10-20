import { test as base, expect, Page } from '@playwright/test';
import { cleanDatabase } from '../helpers/database';

// Extend the base test with database setup
export const test = base.extend<{
  testDatabase: void;
}>({
  testDatabase: async (_fixtures, use) => {
    // Setup: Clean database before test
    await cleanDatabase();
    
    // Use the fixture
    await use();
    
    // Cleanup: Clean the database after test
    await cleanDatabase();
  },
});

export { expect };

// Helper functions for E2E tests
export class TestHelper {
  /**
   * Generate unique test data to avoid conflicts
   */
  static generateUniqueUser() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    
    return {
      email: `test.user.${timestamp}.${randomSuffix}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`
    };
  }

  /**
   * Generate unique task data
   */
  static generateUniqueTask() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    
    return {
      title: `E2E Test Task ${timestamp}`,
      description: `Description for test task ${randomSuffix}`,
      subject: `Test Subject ${timestamp}`,
      // Use lower-case values to match UI selects and API converters
      type: 'assignment' as const,
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now, date only
    };
  }

  /**
   * Wait for navigation to complete with loading states
   */
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small buffer for React rendering
  }

  /**
   * Fill form field with error handling
   */
  static async fillFormField(page: Page, selector: string, value: string) {
    await page.waitForSelector(selector);
    await page.fill(selector, value);
  }

  /**
   * Click button and wait for response
   */
  static async clickAndWait(page: Page, selector: string, waitForNavigation = false) {
    if (waitForNavigation) {
      await Promise.all([
        page.waitForNavigation(),
        page.click(selector)
      ]);
    } else {
      await page.click(selector);
    }
  }
}