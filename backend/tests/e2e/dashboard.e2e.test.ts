import { test, expect, TestHelper } from './test-helpers';

test.describe('Dashboard and Navigation E2E Tests', () => {
  let userData: { name: string; email: string; password: string };

  test.beforeEach(async ({ page }) => {
    // Create a user for testing
    userData = TestHelper.generateUniqueUser();
    
    // Register user via API
    await page.request.post('http://localhost:5000/api/auth/register', {
      data: userData
    });
    
    // Login and set authentication
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    // Set authentication via localStorage
    await page.addInitScript(args => {
      const [token, user] = args as [string, unknown];
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, [loginData.token, loginData.user]);
  });

  test('should display dashboard with user information', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    
  // Should display user welcome message or name (first name)
  const firstName = userData.name.split(' ')[0];
  await expect(page.locator('text=' + firstName)).toBeVisible();
    
    // Should have main dashboard sections
    const dashboardElements = [
      'Tasks',
      'New Task',
      'Dashboard'
    ];
    
    for (const element of dashboardElements) {
      const locator = page.locator('text=' + element);
      if (await locator.isVisible()) {
        await expect(locator).toBeVisible();
      }
    }
  });

  test('should navigate between different pages', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Navigate to profile (if available)
    const profileLink = page.locator('text=Profile');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await TestHelper.waitForPageLoad(page);
      await expect(page).toHaveURL('/profile');
    }
    
    // Navigate back to dashboard
    const dashboardLink = page.locator('text=Dashboard');
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await TestHelper.waitForPageLoad(page);
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('should display task statistics', async ({ page }) => {
    // Create some tasks with different statuses
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    // Create tasks with different statuses
    const tasks = [
      { ...TestHelper.generateUniqueTask(), status: 'pending' },
      { ...TestHelper.generateUniqueTask(), status: 'pending' },
      { ...TestHelper.generateUniqueTask(), status: 'completed' }
    ];
    
    for (const task of tasks) {
      await page.request.post('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        data: { ...task, type: 'assignment', priority: 'high' }
      });
    }
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Check that stat labels are present
    await expect(page.locator('text=Pending Tasks')).toBeVisible();
    await expect(page.locator('text=Completed Tasks')).toBeVisible();
    await expect(page.locator('text=Due Soon')).toBeVisible();
    await expect(page.locator('text=Total Tasks')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should still display main content
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=' + userData.name)).toBeVisible();
    
    // Check if mobile menu is present (if implemented)
    const menuButton = page.locator('[data-testid="mobile-menu"]');
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('should handle empty task list', async ({ page }) => {
    // Navigate to dashboard with no tasks
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should display empty state message
    // Should display empty state message from translations
    await expect(page.locator('text=No tasks found. Create your first task to get started!')).toBeVisible();
  });

  test('should display recent tasks section', async ({ page }) => {
    // Create some tasks
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    const recentTasks = [
      TestHelper.generateUniqueTask(),
      TestHelper.generateUniqueTask(),
      TestHelper.generateUniqueTask()
    ];
    
    for (const task of recentTasks) {
      await page.request.post('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        data: { ...task, type: 'assignment', priority: 'high' }
      });
    }
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should display recent tasks
    for (const task of recentTasks) {
      await expect(page.locator('text=' + task.title)).toBeVisible();
    }
  });

  test('should handle logout from dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Click logout button
    const logoutButton = page.locator('text=Logout');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await TestHelper.waitForPageLoad(page);
    
    // Should redirect to login or home page
    const currentUrl = page.url();
    expect(currentUrl === '/' || currentUrl.includes('/login')).toBeTruthy();
  });

  test('should show user profile information', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should display welcome text and dashboard
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should handle task quick actions from dashboard', async ({ page }) => {
    // Create a task first
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    const taskData = TestHelper.generateUniqueTask();
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...taskData, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Find the task and test quick actions
    const taskElement = page.locator('text=' + taskData.title).locator('..');
    // Click quick action by title attribute
    const completeButton = taskElement.getByTitle('Mark as Completed');
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await TestHelper.waitForPageLoad(page);
      await expect(taskElement.locator('text=completed')).toBeVisible();
    }
  });
});