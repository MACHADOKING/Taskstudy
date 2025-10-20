import api from './api';
import { showToast } from '../utils/toast';

export interface TaskAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  type: 'assignment' | 'exam' | 'reading';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  attachments: TaskAttachment[];
}

export interface CreateTaskData {
  title: string;
  description?: string;
  subject: string;
  type: 'assignment' | 'exam' | 'reading';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: TaskAttachment[];
}

type ApiTask = Omit<Task, 'type' | 'priority' | 'status'> & {
  type: 'ASSIGNMENT' | 'EXAM' | 'READING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED';
  attachments?: TaskAttachment[] | null;
};

const normalizeTask = (task: ApiTask): Task => ({
  ...task,
  type: task.type.toLowerCase() as Task['type'],
  priority: task.priority.toLowerCase() as Task['priority'],
  status: task.status.toLowerCase() as Task['status'],
  attachments: Array.isArray(task.attachments) ? task.attachments : [],
});

export interface TasksResponse {
  success: boolean;
  count: number;
  data: ApiTask[];
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data: ApiTask;
}

export const taskService = {
  async getTasks(filters?: {
    status?: string;
    subject?: string;
    type?: string;
    priority?: string;
    sortBy?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }): Promise<Task[]> {
    try {
      const response = await api.get<TasksResponse>('/tasks', {
        params: filters,
      });
      return response.data.data.map(normalizeTask);
    } catch (error) {
      showToast.apiError(error, 'toastTasksLoadError');
      throw error;
    }
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const response = await api.post<TaskResponse>('/tasks', data);
      showToast.success('toastTaskCreateSuccess');
      return normalizeTask(response.data.data);
    } catch (error) {
      showToast.apiError(error, 'toastTaskCreateError');
      throw error;
    }
  },

  async updateTask(id: string, data: Partial<CreateTaskData & { status?: string }>): Promise<Task> {
    try {
      const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
      showToast.success('toastTaskUpdateSuccess');
      return normalizeTask(response.data.data);
    } catch (error) {
      showToast.apiError(error, 'toastTaskUpdateError');
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`);
      showToast.success('toastTaskDeleteSuccess');
    } catch (error) {
      showToast.apiError(error, 'toastTaskDeleteError');
      throw error;
    }
  },

  async toggleTaskStatus(id: string, currentStatus: string): Promise<Task> {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    return this.updateTask(id, { status: newStatus });
  },
};