import { prisma } from '../config/database';
import { Task as PrismaTask, TaskType, Priority, Status, Prisma } from '@prisma/client';

export interface TaskAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface ITask {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  type: TaskType;
  dueDate: Date;
  priority: Priority;
  status: Status;
  attachments?: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const toJsonValue = (value: TaskAttachment[]): Prisma.InputJsonValue =>
  value as unknown as Prisma.InputJsonValue;

const sanitizeAttachments = (attachments?: unknown): TaskAttachment[] => {
  if (!attachments) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    throw new Error('Attachments must be an array');
  }

  return attachments.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as { name?: unknown }).name !== 'string' ||
      typeof (item as { type?: unknown }).type !== 'string' ||
      typeof (item as { data?: unknown }).data !== 'string'
    ) {
      throw new Error('Invalid attachment payload');
    }

    const name = (item as { name: string }).name.trim();
    const type = (item as { type: string }).type;
    const data = (item as { data: string }).data;
    const size = typeof (item as { size?: unknown }).size === 'number'
      ? (item as { size: number }).size
      : Math.ceil((data.length * 3) / 4); // approximate base64 size

    if (!name) {
      throw new Error('Attachment name is required');
    }

    if (!ALLOWED_MIME_TYPES.has(type)) {
      throw new Error('Unsupported attachment type');
    }

    if (size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error('Attachment exceeds the 5MB limit');
    }

    return {
      name,
      type,
      data,
      size,
    };
  });
};

export class TaskService {
  static async create(data: {
    userId: string;
    title: string;
    description?: string;
    subject: string;
    type: TaskType;
    dueDate: Date;
    priority?: Priority;
    status?: Status;
    attachments?: TaskAttachment[];
  }): Promise<PrismaTask> {
    // Validate input
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters long');
    }
    
    if (data.title.length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }
    
    if (!data.subject) {
      throw new Error('Subject is required');
    }
    
    if (data.subject.length > 100) {
      throw new Error('Subject cannot exceed 100 characters');
    }
    
    if (data.description && data.description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }
    
    if (data.dueDate <= new Date()) {
      throw new Error('Due date must be in the future');
    }

    const attachments = sanitizeAttachments(data.attachments);

    return prisma.task.create({
      data: {
        userId: data.userId,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        subject: data.subject.trim(),
        type: data.type,
        dueDate: data.dueDate,
        priority: data.priority || Priority.MEDIUM,
        status: data.status || Status.PENDING,
        attachments: toJsonValue(attachments),
      } as Prisma.TaskUncheckedCreateInput,
    });
  }

  static async findByUserId(userId: string, filters?: {
    status?: Status;
    subject?: string;
    type?: TaskType;
    priority?: Priority;
    sortBy?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
  }): Promise<PrismaTask[]> {
    const where: Prisma.TaskWhereInput = {
      userId,
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      const dueDateFilter: Prisma.DateTimeFilter = {};
      if (filters.dueDateFrom) {
        dueDateFilter.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        dueDateFilter.lte = filters.dueDateTo;
      }

      where.dueDate = dueDateFilter;
    }

    const allowedSortFields = new Set(['dueDate', 'createdAt', 'title', 'priority', 'subject']);
    let orderBy: Prisma.TaskOrderByWithRelationInput | Prisma.TaskOrderByWithRelationInput[] = {
      dueDate: 'asc',
    };

    if (filters?.sortBy && allowedSortFields.has(filters.sortBy)) {
      orderBy = { [filters.sortBy]: 'asc' } as Prisma.TaskOrderByWithRelationInput;
    }

    return prisma.task.findMany({
      where,
      orderBy,
    });
  }

  static async findById(id: string): Promise<PrismaTask | null> {
    return prisma.task.findUnique({
      where: { id },
    });
  }

  static async update(id: string, data: Partial<{
    title: string;
    description: string;
    subject: string;
    type: TaskType;
    dueDate: Date;
    priority: Priority;
    status: Status;
    attachments: TaskAttachment[];
  }>): Promise<PrismaTask> {
    // Validate if updating
    if (data.title !== undefined) {
      if (!data.title || data.title.length < 3) {
        throw new Error('Title must be at least 3 characters long');
      }
      if (data.title.length > 200) {
        throw new Error('Title cannot exceed 200 characters');
      }
      data.title = data.title.trim();
    }
    
    if (data.subject !== undefined) {
      if (!data.subject) {
        throw new Error('Subject is required');
      }
      if (data.subject.length > 100) {
        throw new Error('Subject cannot exceed 100 characters');
      }
      data.subject = data.subject.trim();
    }
    
    if (data.description !== undefined && data.description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }
    
    if (data.dueDate !== undefined && data.dueDate <= new Date()) {
      throw new Error('Due date must be in the future');
    }

    const prismaData: Prisma.TaskUncheckedUpdateInput = {
      ...data,
      ...(data.attachments !== undefined
        ? { attachments: toJsonValue(sanitizeAttachments(data.attachments)) }
        : {}),
    } as Prisma.TaskUncheckedUpdateInput;

    return prisma.task.update({
      where: { id },
      data: prismaData,
    });
  }

  static async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }

  static async findTasksDueSoon(hoursAhead: number): Promise<(PrismaTask & { user: { name: string; email: string } })[]> {
    const now = new Date();
    const targetDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const windowStart = new Date(targetDate.getTime() - 30 * 60 * 1000); // 30 min before
    const windowEnd = new Date(targetDate.getTime() + 30 * 60 * 1000); // 30 min after

    return prisma.task.findMany({
      where: {
        status: Status.PENDING,
        dueDate: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

// For backward compatibility, export Task as the service
export const Task = TaskService;

// Helper functions to convert between string and enum values
export const convertTaskType = (type: string): TaskType => {
  if (!type) {
    throw new Error('Task type is required');
  }
  
  switch (type.toLowerCase()) {
    case 'assignment': return TaskType.ASSIGNMENT;
    case 'exam': return TaskType.EXAM;
    case 'reading': return TaskType.READING;
    default: throw new Error(`Invalid task type: ${type}`);
  }
};

export const convertPriority = (priority: string): Priority => {
  switch (priority.toLowerCase()) {
    case 'low': return Priority.LOW;
    case 'medium': return Priority.MEDIUM;
    case 'high': return Priority.HIGH;
    default: throw new Error(`Invalid priority: ${priority}`);
  }
};

export const convertStatus = (status: string): Status => {
  switch (status.toLowerCase()) {
    case 'pending': return Status.PENDING;
    case 'completed': return Status.COMPLETED;
    default: throw new Error(`Invalid status: ${status}`);
  }
};