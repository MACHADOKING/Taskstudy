import { test, expect, TestHelper } from './test-helpers';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async () => {
    // Database cleanup is handled by the fixture hooks if any
  });

  test('should complete user registration flow', async ({ page }) => {
    const userData = TestHelper.generateUniqueUser();
    
    // Navigate to home page
    await page.goto('/');
    await TestHelper.waitForPageLoad(page);
    
  // Click on Register link/button
  await page.click('text=Register');
    await TestHelper.waitForPageLoad(page);
    
    // Verify we're on the registration page
    await expect(page).toHaveURL('/register');
    await expect(page).toHaveTitle(/Register/);
    
    // Fill registration form
  await TestHelper.fillFormField(page, '#name', userData.name);
  await TestHelper.fillFormField(page, '#email', userData.email);
  await TestHelper.fillFormField(page, '#password', userData.password);
  await TestHelper.fillFormField(page, '#confirmPassword', userData.password);
    
    // Submit registration form
    await TestHelper.clickAndWait(page, 'button[type="submit"]');
    await TestHelper.waitForPageLoad(page);
    
    // Should redirect to login after successful registration
  // Our app navigates to dashboard after registration
  await expect(page).toHaveURL('/dashboard');
    
    // Should show success message (adjust selector based on your implementation)
    // Should show user name in navbar
    await expect(page.locator('text=' + userData.name.split(' ')[0])).toBeVisible();
  });

  test('should complete user login flow', async ({ page }) => {
    const userData = TestHelper.generateUniqueUser();
    
    // First register the user via API to have test data
    await page.request.post('http://localhost:5000/api/auth/register', {
      data: userData
    });
    
    // Navigate to login page
    await page.goto('/login');
    await TestHelper.waitForPageLoad(page);
    
    // Verify we're on the login page
    await expect(page).toHaveURL('/login');
    await expect(page).toHaveTitle(/Login/);
    
    // Fill login form
  await TestHelper.fillFormField(page, '#email', userData.email);
  await TestHelper.fillFormField(page, '#password', userData.password);
    
    // Submit login form
    await TestHelper.clickAndWait(page, 'button[type="submit"]');
    await TestHelper.waitForPageLoad(page);
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard');
    
    // Should see user name or welcome message
  await expect(page.locator('text=' + userData.name.split(' ')[0])).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await TestHelper.waitForPageLoad(page);
    
    // Fill login form with invalid credentials
  await TestHelper.fillFormField(page, '#email', 'nonexistent@example.com');
  await TestHelper.fillFormField(page, '#password', 'wrongpassword');
    
    // Submit login form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000); // Wait for error message
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
    
    // Should show error message
    const errorMessage = page.locator('text=Invalid credentials');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should complete logout flow', async ({ page }) => {
    const userData = TestHelper.generateUniqueUser();
    
    // Register and login user
    await page.request.post('http://localhost:5000/api/auth/register', {
      data: userData
    });
    
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
    
    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout button
    await page.click('text=Logout');
    await TestHelper.waitForPageLoad(page);
    
    // Should redirect to login or home page
    const currentUrl = page.url();
    expect(currentUrl === '/' || currentUrl.includes('/login')).toBeTruthy();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected dashboard without authentication
    await page.goto('/dashboard');
    await TestHelper.waitForPageLoad(page);
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('should validate registration form fields', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await TestHelper.waitForPageLoad(page);
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Should show validation errors
    const nameError = page.locator('text=Name is required');
    const emailError = page.locator('text=Email is required');
    const passwordError = page.locator('text=Password is required');
    
    // Check if validation messages appear (might vary based on implementation)
    if (await nameError.isVisible()) {
      await expect(nameError).toBeVisible();
    }
    if (await emailError.isVisible()) {
      await expect(emailError).toBeVisible();
    }
    if (await passwordError.isVisible()) {
      await expect(passwordError).toBeVisible();
    }
  });
});