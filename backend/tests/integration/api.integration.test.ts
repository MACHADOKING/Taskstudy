import request from 'supertest';
import app from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Integration Tests - Full API Flow', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    await setupTestDatabase();
  });

  describe('Authentication Flow', () => {
    it('should complete full auth flow: register -> login -> profile', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'Integration User',
        email: `integration${timestamp}@example.com`,
        password: 'password123'
      };

      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user.email).toBe(userData.email);

      const token = registerResponse.body.token;
      userId = registerResponse.body.user.id;

      // 2. Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.email).toBe(userData.email);

      // 3. Access protected profile endpoint
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('user');
      expect(profileResponse.body.user.email).toBe(userData.email);
      expect(profileResponse.body.user.id).toBe(userId);
    });

    it('should reject invalid credentials', async () => {
      // Try to login with non-existent user
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Register user first
      const timestamp2 = Date.now();
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `test${timestamp2}@example.com`,
          password: 'correctpassword'
        })
        .expect(201);

      // Try with wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: `test${timestamp2}@example.com`,
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  describe('Task Management Flow', () => {
    beforeEach(async () => {
      // Register and login user for task tests
      const timestamp3 = Date.now();
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Task User',
          email: `task${timestamp3}@example.com`,
          password: 'password123'
        });

      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should complete full task CRUD flow', async () => {
      const taskData = {
        title: 'Integration Task',
        description: 'Test task for integration',
        subject: 'Integration Testing',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      // 1. Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('success', true);
      expect(createResponse.body.data.title).toBe(taskData.title);
      expect(createResponse.body.data.userId).toBe(userId);

      const taskId = createResponse.body.data.id;

      // 2. Get all tasks
      const getAllResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getAllResponse.body).toHaveProperty('success', true);
      expect(getAllResponse.body.data).toHaveLength(1);
      expect(getAllResponse.body.data[0].id).toBe(taskId);

      // 3. Get specific task
      const getOneResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getOneResponse.body).toHaveProperty('success', true);
      expect(getOneResponse.body.data.id).toBe(taskId);
      expect(getOneResponse.body.data.title).toBe(taskData.title);

      // 4. Update task
      const updateData = {
        title: 'Updated Integration Task',
        status: 'COMPLETED',
        priority: 'LOW'
      };

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('success', true);
      expect(updateResponse.body.data.title).toBe(updateData.title);
      expect(updateResponse.body.data.status).toBe(updateData.status);
      expect(updateResponse.body.data.priority).toBe(updateData.priority);

      // 5. Delete task
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 6. Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // 7. Verify empty task list
      const finalGetAllResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalGetAllResponse.body.data).toHaveLength(0);
    });

    it('should handle multiple users with isolated tasks', async () => {
      // Create second user
      const timestamp4 = Date.now() + 1; // Add 1ms to ensure unique timestamp
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: `user2${timestamp4}@example.com`,
          password: 'password123'
        });

      const user2Token = user2Response.body.token;

      // Create tasks for both users
      const task1Data = {
        title: 'User 1 Task',
        description: 'Task for user 1',
        subject: 'Math',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      const task2Data = {
        title: 'User 2 Task',
        description: 'Task for user 2',
        subject: 'Physics',
        type: 'EXAM',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      // User 1 creates task
      const user1TaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task1Data)
        .expect(201);

      // User 2 creates task
      const user2TaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(task2Data)
        .expect(201);

      // User 1 should only see their task
      const user1TasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(user1TasksResponse.body.data).toHaveLength(1);
      expect(user1TasksResponse.body.data[0].title).toBe(task1Data.title);

      // User 2 should only see their task
      const user2TasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2TasksResponse.body.data).toHaveLength(1);
      expect(user2TasksResponse.body.data[0].title).toBe(task2Data.title);

      // User 1 should not be able to access User 2's task
      await request(app)
        .get(`/api/tasks/${user2TaskResponse.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // User 2 should not be able to access User 1's task
      await request(app)
        .get(`/api/tasks/${user1TaskResponse.body.data.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('should handle task filtering and pagination scenarios', async () => {
      // Create multiple tasks with different properties
      const tasks = [
        {
          title: 'Math Assignment',
          subject: 'Mathematics',
          type: 'ASSIGNMENT',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Physics Exam',
          subject: 'Physics',
          type: 'EXAM',
          priority: 'MEDIUM',
          status: 'COMPLETED',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Chemistry Reading',
          subject: 'Chemistry',
          type: 'READING',
          priority: 'LOW',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Create all tasks
      const taskIds = [];
      for (const task of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: `Description for ${task.title}`,
            ...task
          })
          .expect(201);

        taskIds.push(response.body.data.id);
      }

      // Get all tasks and verify count
      const allTasksResponse = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(allTasksResponse.body.data).toHaveLength(3);
      expect(allTasksResponse.body).toHaveProperty('count', 3);

      // Verify task types are present
      const taskTypes = allTasksResponse.body.data.map((task: { type: string }) => task.type);
      expect(taskTypes).toContain('ASSIGNMENT');
      expect(taskTypes).toContain('EXAM');
      expect(taskTypes).toContain('READING');

      // Verify task statuses
      const taskStatuses = allTasksResponse.body.data.map((task: { status: string }) => task.status);
      expect(taskStatuses).toContain('PENDING');
      expect(taskStatuses).toContain('COMPLETED');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      const timestamp5 = Date.now();
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Error Test User',
          email: `error${timestamp5}@example.com`,
          password: 'password123'
        });

      authToken = response.body.token;
    });

    it('should handle malformed requests gracefully', async () => {
      // Missing required fields
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Task'
          // Missing required fields
        })
        .expect(400);

      // Invalid enum values
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Task',
          description: 'Test description',
          subject: 'Test Subject',
          type: 'INVALID_TYPE',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(400);

      // Invalid date format
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Date Task',
          description: 'Test description',
          subject: 'Test Subject',
          type: 'ASSIGNMENT',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: 'invalid-date'
        })
        .expect(400);
    });

    it('should handle unauthorized access properly', async () => {
      // No token
      await request(app)
        .get('/api/tasks')
        .expect(401);

      await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized Task',
          description: 'Should not work',
          subject: 'Test',
          type: 'ASSIGNMENT',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(401);

      // Invalid token
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Malformed authorization header
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });

    it('should handle non-existent resources', async () => {
      const fakeTaskId = 'nonexistent123';

      await request(app)
        .get(`/api/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await request(app)
        .put(`/api/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        })
        .expect(404);

      await request(app)
        .delete(`/api/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
