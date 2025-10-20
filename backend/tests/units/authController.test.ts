import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/authRoutes';
import { cleanDatabase, disconnectDatabase } from '../helpers/database';

describe('AuthController', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'John Doe',
        email: `john${timestamp}@example.com`,
        password: 'password123'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate email', async () => {
      const timestamp = Date.now();
      const userData = {
        name: 'User 1',
        email: `duplicate${timestamp}@example.com`,
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          name: 'User 2'
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    let testUser: { name: string; email: string; password: string };

    beforeEach(async () => {
      const timestamp = Date.now();
      testUser = {
        name: 'Test User',
        email: `test${timestamp}@example.com`,
        password: 'password123'
      };
      // Register user through API to ensure proper password hashing
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;
    let profileUser: { name: string; email: string; password: string };

    beforeEach(async () => {
      // Create and login user to get token
      const timestamp = Date.now();
      profileUser = {
        name: 'Profile User',
        email: `profile${timestamp}@example.com`,
        password: 'password123'
      };
      
      // Register user through API to ensure proper password hashing
      await request(app)
        .post('/auth/register')
        .send(profileUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: profileUser.email,
          password: profileUser.password
        });

      authToken = loginResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(profileUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});