import { TaskService, convertTaskType, convertPriority, convertStatus } from '../../src/models/Task';
import { TaskType, Priority, Status } from '@prisma/client';
import { cleanDatabase, createTestUser } from '../helpers/database';

describe('TaskService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('create', () => {
    let testUser: { id: string; name: string; email: string; password: string };
    let validTaskData: {
      userId: string;
      title: string;
      description: string;
      subject: string;
      type: TaskType;
      dueDate: Date;
      priority: Priority;
      status: Status;
    };

    beforeEach(async () => {
      // Create a test user first with unique email and hashed password
      testUser = await createTestUser();

      validTaskData = {
        userId: testUser.id,
        title: 'Test Task',
        description: 'Test description',
        subject: 'Test Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
        priority: Priority.MEDIUM,
        status: Status.PENDING,
      };
    });

    it('should create a task with valid data', async () => {
      const task = await TaskService.create(validTaskData);
      
      expect(task).toBeDefined();
      expect(task.title).toBe(validTaskData.title);
      expect(task.description).toBe(validTaskData.description);
      expect(task.subject).toBe(validTaskData.subject);
      expect(task.type).toBe(validTaskData.type);
      expect(task.priority).toBe(validTaskData.priority);
      expect(task.status).toBe(validTaskData.status);
      expect(task.userId).toBe(validTaskData.userId);
    });

    it('should throw error for title shorter than 3 characters', async () => {
      const invalidData = { ...validTaskData, title: 'ab' };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Title must be at least 3 characters long'
      );
    });

    it('should throw error for title longer than 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const invalidData = { ...validTaskData, title: longTitle };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Title cannot exceed 200 characters'
      );
    });

    it('should throw error for missing subject', async () => {
      const invalidData = { ...validTaskData, subject: '' };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Subject is required'
      );
    });

    it('should throw error for subject longer than 100 characters', async () => {
      const longSubject = 'a'.repeat(101);
      const invalidData = { ...validTaskData, subject: longSubject };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Subject cannot exceed 100 characters'
      );
    });

    it('should throw error for description longer than 1000 characters', async () => {
      const longDescription = 'a'.repeat(1001);
      const invalidData = { ...validTaskData, description: longDescription };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Description cannot exceed 1000 characters'
      );
    });

    it('should throw error for due date in the past', async () => {
      const pastDate = new Date('2020-01-01');
      const invalidData = { ...validTaskData, dueDate: pastDate };
      
      await expect(TaskService.create(invalidData)).rejects.toThrow(
        'Due date must be in the future'
      );
    });

    it('should trim title and description whitespace', async () => {
      const dataWithWhitespace = {
        ...validTaskData,
        title: '  Test Task  ',
        description: '  Test description  ',
        subject: '  Test Subject  ',
      };
      
      const task = await TaskService.create(dataWithWhitespace);
      
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test description');
      expect(task.subject).toBe('Test Subject');
    });
  });

  describe('findByUserId', () => {
    it('should return tasks for specific user', async () => {
      // Create users using the test helper
      const user1 = await createTestUser({
        name: 'User One'
      });
      
      const user2 = await createTestUser({
        name: 'User Two'
      });
      
      // Create tasks for each user
      const task1 = await TaskService.create({
        userId: user1.id,
        title: 'User 1 Task',
        subject: 'Subject One',
        description: 'Test description',
        type: TaskType.ASSIGNMENT,
        priority: Priority.MEDIUM,
        status: Status.PENDING,
        dueDate: new Date('2025-12-31'),
      });
      
      const task2 = await TaskService.create({
        userId: user2.id,
        title: 'User 2 Task',
        subject: 'Subject Two',
        description: 'Test description',
        type: TaskType.EXAM,
        priority: Priority.HIGH,
        status: Status.PENDING,
        dueDate: new Date('2025-12-31'),
      });
      
      // Verify tasks are returned for correct users
      const user1Tasks = await TaskService.findByUserId(user1.id);
      const user2Tasks = await TaskService.findByUserId(user2.id);
      
      expect(user1Tasks).toHaveLength(1);
      expect(user1Tasks[0].id).toBe(task1.id);
      expect(user1Tasks[0].title).toBe('User 1 Task');
      
      expect(user2Tasks).toHaveLength(1);
      expect(user2Tasks[0].id).toBe(task2.id);
      expect(user2Tasks[0].title).toBe('User 2 Task');
    });

    it('should filter tasks by status', async () => {
      const user = await createTestUser({
        name: 'Filter Test User'
      });
      
      await TaskService.create({
        userId: user.id,
        title: 'Pending Task',
        subject: 'Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
        status: Status.PENDING,
      });
      
      await TaskService.create({
        userId: user.id,
        title: 'Completed Task',
        subject: 'Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
        status: Status.COMPLETED,
      });
      
      const pendingTasks = await TaskService.findByUserId(user.id, { status: Status.PENDING });
      const completedTasks = await TaskService.findByUserId(user.id, { status: Status.COMPLETED });
      
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].title).toBe('Pending Task');
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Completed Task');
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      const user = await createTestUser({
        name: 'FindById User'
      });
      
      const task = await TaskService.create({
        userId: user.id,
        title: 'Test Task',
        subject: 'Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
      });
      
      const foundTask = await TaskService.findById(task.id);
      
      expect(foundTask).toBeDefined();
      expect(foundTask!.id).toBe(task.id);
      expect(foundTask!.title).toBe(task.title);
    });

    it('should return null for non-existent id', async () => {
      const task = await TaskService.findById('non-existent-id');
      expect(task).toBeNull();
    });
  });

  describe('update', () => {
    it('should update task fields', async () => {
      const user = await createTestUser({
        name: 'Update User'
      });
      
      const task = await TaskService.create({
        userId: user.id,
        title: 'Original Title',
        subject: 'Original Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
      });
      
      const updatedTask = await TaskService.update(task.id, {
        title: 'Updated Title',
        status: Status.COMPLETED,
      });
      
      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.status).toBe(Status.COMPLETED);
      expect(updatedTask.subject).toBe('Original Subject'); // unchanged
    });
  });

  describe('delete', () => {
    it('should delete task by id', async () => {
      const user = await createTestUser({
        name: 'Delete User'
      });
      
      const task = await TaskService.create({
        userId: user.id,
        title: 'Task to Delete',
        subject: 'Subject',
        type: TaskType.ASSIGNMENT,
        dueDate: new Date('2025-12-31'),
      });
      
      await TaskService.delete(task.id);
      
      const deletedTask = await TaskService.findById(task.id);
      expect(deletedTask).toBeNull();
    });
  });
});

describe('Conversion Functions', () => {
  describe('convertTaskType', () => {
    it('should convert string to TaskType enum', () => {
      expect(convertTaskType('assignment')).toBe(TaskType.ASSIGNMENT);
      expect(convertTaskType('ASSIGNMENT')).toBe(TaskType.ASSIGNMENT);
      expect(convertTaskType('exam')).toBe(TaskType.EXAM);
      expect(convertTaskType('reading')).toBe(TaskType.READING);
    });

    it('should throw error for invalid task type', () => {
      expect(() => convertTaskType('invalid')).toThrow('Invalid task type: invalid');
    });
  });

  describe('convertPriority', () => {
    it('should convert string to Priority enum', () => {
      expect(convertPriority('low')).toBe(Priority.LOW);
      expect(convertPriority('LOW')).toBe(Priority.LOW);
      expect(convertPriority('medium')).toBe(Priority.MEDIUM);
      expect(convertPriority('high')).toBe(Priority.HIGH);
    });

    it('should throw error for invalid priority', () => {
      expect(() => convertPriority('invalid')).toThrow('Invalid priority: invalid');
    });
  });

  describe('convertStatus', () => {
    it('should convert string to Status enum', () => {
      expect(convertStatus('pending')).toBe(Status.PENDING);
      expect(convertStatus('PENDING')).toBe(Status.PENDING);
      expect(convertStatus('completed')).toBe(Status.COMPLETED);
    });

    it('should throw error for invalid status', () => {
      expect(() => convertStatus('invalid')).toThrow('Invalid status: invalid');
    });
  });
});