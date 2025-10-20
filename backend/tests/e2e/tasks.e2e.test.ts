import { test, expect, TestHelper } from './test-helpers';

test.describe('Task Management E2E Tests', () => {
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
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
  });

  test('should create a new task', async ({ page }) => {
    const taskData = TestHelper.generateUniqueTask();
    
    // Click on "Add Task" or "Create Task" button
  await page.click('text=New Task', { timeout: 5000 });
    await TestHelper.waitForPageLoad(page);
    
    // Fill task form
  await TestHelper.fillFormField(page, '#title', taskData.title);
  await TestHelper.fillFormField(page, '#description', taskData.description);
  await TestHelper.fillFormField(page, '#subject', taskData.subject);
    
    // Select task type
  await page.selectOption('#type', taskData.type);
    
    // Select priority
  await page.selectOption('#priority', taskData.priority);
    
    // Set due date
  await TestHelper.fillFormField(page, '#dueDate', taskData.dueDate);
    
    // Submit the form
    await TestHelper.clickAndWait(page, 'button[type="submit"]');
    await TestHelper.waitForPageLoad(page);
    
    // Should redirect back to dashboard or task list
  await expect(page).toHaveURL('/dashboard');
    
    // Should see the created task in the list
    await expect(page.locator('text=' + taskData.title)).toBeVisible();
  });

  test('should display task list', async ({ page }) => {
    // Create a task via API first
    const taskData = TestHelper.generateUniqueTask();
    
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...taskData, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    // Refresh the page to see the new task
    await page.reload();
    await TestHelper.waitForPageLoad(page);
    
    // Should see task in the list
    await expect(page.locator('text=' + taskData.title)).toBeVisible();
    await expect(page.locator('text=' + taskData.subject)).toBeVisible();
  });

  test('should edit an existing task', async ({ page }) => {
    // Create a task first
    const taskData = TestHelper.generateUniqueTask();
    
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...taskData, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    // Refresh to see the task
    await page.reload();
    await TestHelper.waitForPageLoad(page);
    
    // Click edit button for the task
  const taskRow = page.locator(`text=${taskData.title}`).locator('..');
  await taskRow.getByTitle('Edit task').click();
    await TestHelper.waitForPageLoad(page);
    
    // Update task title
    const updatedTitle = taskData.title + ' - Updated';
  await page.fill('#title', '');
  await TestHelper.fillFormField(page, '#title', updatedTitle);
    
    // Update status to completed
  // Toggle status is handled via quick action later; form has no status field
    
    // Submit the form
    await TestHelper.clickAndWait(page, 'button[type="submit"]');
    await TestHelper.waitForPageLoad(page);
    
    // Should see updated task
    await expect(page.locator('text=' + updatedTitle)).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    const taskData = TestHelper.generateUniqueTask();
    
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...taskData, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    // Refresh to see the task
    await page.reload();
    await TestHelper.waitForPageLoad(page);
    
    // Verify task exists
    await expect(page.locator('text=' + taskData.title)).toBeVisible();
    
    // Click delete button for the task
  const taskRow2 = page.locator(`text=${taskData.title}`).locator('..');
  await taskRow2.getByTitle('Delete task').click();
    
    // Handle confirmation dialog if it exists
    page.on('dialog', dialog => dialog.accept());
    
    await TestHelper.waitForPageLoad(page);
    
    // Task should no longer be visible
    await expect(page.locator('text=' + taskData.title)).not.toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    // Create tasks with different statuses
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
  const pendingTask = { ...TestHelper.generateUniqueTask(), status: 'pending' };
  const completedTask = { ...TestHelper.generateUniqueTask(), status: 'completed' };
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...pendingTask, type: 'assignment', priority: 'high' }
    });
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...completedTask, type: 'assignment', priority: 'high' }
    });
    
    // Refresh to see the tasks
    await page.reload();
    await TestHelper.waitForPageLoad(page);
    
    // Both tasks should be visible initially
    await expect(page.locator('text=' + pendingTask.title)).toBeVisible();
    await expect(page.locator('text=' + completedTask.title)).toBeVisible();
    
    // Filter by PENDING status
  const statusFilter = page.locator('#status');
    if (await statusFilter.isVisible()) {
      await page.selectOption('select[name="status"]', 'PENDING');
      await TestHelper.waitForPageLoad(page);
      
      // Only pending task should be visible
      await expect(page.locator('text=' + pendingTask.title)).toBeVisible();
      await expect(page.locator('text=' + completedTask.title)).not.toBeVisible();
    }
  });

  test('should search tasks by title', async ({ page }) => {
    // Create multiple tasks
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });
    
    const loginData = await loginResponse.json();
    
  const task1 = { ...TestHelper.generateUniqueTask(), title: 'Search Test Task Alpha' };
  const task2 = { ...TestHelper.generateUniqueTask(), title: 'Search Test Task Beta' };
  const task3 = { ...TestHelper.generateUniqueTask(), title: 'Different Task' };
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...task1, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...task2, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    await page.request.post('http://localhost:5000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      data: { ...task3, type: 'assignment', priority: 'high', status: 'pending' }
    });
    
    // Refresh to see the tasks
    await page.reload();
    await TestHelper.waitForPageLoad(page);
    
    // All tasks should be visible initially
    await expect(page.locator('text=' + task1.title)).toBeVisible();
    await expect(page.locator('text=' + task2.title)).toBeVisible();
    await expect(page.locator('text=' + task3.title)).toBeVisible();
    
    // Search for "Alpha"
    const searchInput = page.locator('#search');
    if (await searchInput.isVisible()) {
      await TestHelper.fillFormField(page, '#search', 'Alpha');
      await page.keyboard.press('Enter');
      await TestHelper.waitForPageLoad(page);
      
      // Only task1 should be visible
      await expect(page.locator('text=' + task1.title)).toBeVisible();
      await expect(page.locator('text=' + task2.title)).not.toBeVisible();
      await expect(page.locator('text=' + task3.title)).not.toBeVisible();
    }
  });
});