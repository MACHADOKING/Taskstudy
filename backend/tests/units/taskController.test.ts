import request from 'supertest';
import express from 'express';
import taskRouter from '../../src/routes/taskRoutes';
import authRouter from '../../src/routes/authRoutes';
import { cleanDatabase, disconnectDatabase } from '../helpers/database';

describe('TaskController', () => {
  let app: express.Application;
  let authToken: string;
  let testUser: { id: string; name: string; email: string; password: string };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    app.use('/tasks', taskRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
    
    // Create test user and get auth token using API endpoints
    const timestamp = Date.now();
    const userData = {
      name: 'Task Test User',
      email: `tasktest${timestamp}@example.com`,
      password: 'password123'
    };

    const registerResponse = await request(app)
      .post('/auth/register')
      .send(userData);

    testUser = {
      id: registerResponse.body.user.id,
      name: registerResponse.body.user.name,
      email: registerResponse.body.user.email,
      password: userData.password
    };

    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /tasks', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        subject: 'Math',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.type).toBe(taskData.type);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid enum values', async () => {
      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          type: 'INVALID_TYPE',
          priority: 'INVALID_PRIORITY',
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          subject: 'Math',
          type: 'ASSIGNMENT',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      const taskData1 = {
        title: 'Task 1',
        description: 'Description 1',
        subject: 'Math',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const taskData2 = {
        title: 'Task 2',
        description: 'Description 2',
        subject: 'Physics',
        type: 'EXAM',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData1);

      await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData2);
    });

    it('should get all user tasks', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0].userId).toBe(testUser.id);
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Specific Task',
          description: 'Specific Description',
          subject: 'Chemistry',
          type: 'ASSIGNMENT',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        });

      taskId = taskResponse.body.data.id;
    });

    it('should get specific task by id', async () => {
      const response = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', taskId);
      expect(response.body.data.title).toBe('Specific Task');
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get(`/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Task',
          description: 'Original Description',
          subject: 'Biology',
          type: 'ASSIGNMENT',
          priority: 'LOW',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });

      taskId = taskResponse.body.data.id;
    });

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'HIGH',
        status: 'COMPLETED'
      };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Task updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should return 400 for invalid enum values', async () => {
      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priority: 'INVALID_PRIORITY',
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task'
        })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send({
          title: 'Updated Task'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete',
          description: 'Will be deleted',
          subject: 'History',
          type: 'ASSIGNMENT',
          priority: 'LOW',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        });

      taskId = taskResponse.body.data.id;
    });

    it('should delete task successfully', async () => {
      await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .delete(`/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});