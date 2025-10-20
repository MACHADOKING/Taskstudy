import { Response } from 'express';
import { Task, convertTaskType, convertPriority, convertStatus } from '../models/Task';
import { AuthRequest } from '../middlewares/auth';

// Get all tasks for logged-in user
export const getTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User ID not found',
      });
      return;
    }

    const {
      status,
      subject,
      type,
      priority,
      sortBy,
      dueDateFrom,
      dueDateTo,
    } = req.query;

    const parseDate = (value: unknown, endOfDay = false): Date | undefined => {
      if (!value) {
        return undefined;
      }

      const dateValue = typeof value === 'string' ? value.trim() : String(value).trim();
      if (!dateValue) {
        return undefined;
      }

      // If the value already contains time information, trust it as ISO.
      if (dateValue.includes('T')) {
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error('Invalid date filter');
        }
        return parsed;
      }

      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
      if (!match) {
        throw new Error('Invalid date filter');
      }

      const [, yearStr, monthStr, dayStr] = match;
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const day = Number(dayStr);

      const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      if (endOfDay) {
        date.setUTCHours(23, 59, 59, 999);
      }

      if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date filter');
      }

      return date;
    };

    const dueDateFromParsed = parseDate(dueDateFrom);
    const dueDateToParsed = parseDate(dueDateTo, true);

    if (dueDateFromParsed && dueDateToParsed && dueDateFromParsed > dueDateToParsed) {
      res.status(400).json({
        success: false,
        message: 'The start date must be before the end date',
      });
      return;
    }

    const filters = {
      status: status ? convertStatus(String(status)) : undefined,
      subject: subject ? String(subject) : undefined,
      type: type ? convertTaskType(String(type)) : undefined,
      priority: priority ? convertPriority(String(priority)) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      dueDateFrom: dueDateFromParsed,
      dueDateTo: dueDateToParsed,
    };

    const tasks = await Task.findByUserId(req.userId, filters);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);

    if (error instanceof Error && error.message === 'Invalid date filter') {
      res.status(400).json({
        success: false,
        message: 'Invalid date filter provided',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
    });
  }
};

// Create new task
export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User ID not found',
      });
      return;
    }

    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
      : [];

    const taskData = {
      ...req.body,
      userId: req.userId,
      type: convertTaskType(req.body.type),
      priority: req.body.priority ? convertPriority(req.body.priority) : undefined,
      status: req.body.status ? convertStatus(req.body.status) : undefined,
      dueDate: new Date(req.body.dueDate),
      attachments,
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error: unknown) {
    console.error('Create task error:', error);

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error creating task',
    });
  }
};

// Get task by ID
export const getTaskById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User ID not found',
      });
      return;
    }

    const task = await Task.findById(id);
    
    if (!task || task.userId !== req.userId) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
    });
  }
};

// Update task by ID
export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User ID not found',
      });
      return;
    }

    // First verify the task belongs to the user
    const existingTask = await Task.findById(id);
    if (!existingTask || existingTask.userId !== req.userId) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    // Convert string values to enums if provided
    const updateData: Record<string, unknown> = { ...req.body };
    if (updateData.type) updateData.type = convertTaskType(updateData.type as string);
    if (updateData.priority) updateData.priority = convertPriority(updateData.priority as string);
    if (updateData.status) updateData.status = convertStatus(updateData.status as string);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate as string);
    if (updateData.attachments !== undefined && !Array.isArray(updateData.attachments)) {
      res.status(400).json({
        success: false,
        message: 'Invalid attachments payload',
      });
      return;
    }

    const task = await Task.update(id, updateData);

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error: unknown) {
    console.error('Update task error:', error);

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error updating task',
    });
  }
};

// Delete task by ID
export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'User ID not found',
      });
      return;
    }

    // First verify the task belongs to the user
    const existingTask = await Task.findById(id);
    if (!existingTask || existingTask.userId !== req.userId) {
      res.status(404).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    await Task.delete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
    });
  }
};