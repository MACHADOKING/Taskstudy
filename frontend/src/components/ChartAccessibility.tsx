import React from 'react';
import { Task } from '../services/taskService';

interface ChartAccessibilityProps {
  tasks: Task[];
  chartType: 'monthly' | 'status' | 'type';
}

export const ChartAccessibility: React.FC<ChartAccessibilityProps> = ({ 
  tasks, 
  chartType 
}) => {

  const isTaskOverdue = (task: Task) => {
    if (task.status !== 'pending') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return Number.isFinite(dueTime) && dueTime < Date.now();
  };

  const generateDescription = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const overdueTasks = tasks.filter(isTaskOverdue);
    const pendingActiveTasks = tasks.filter(task => task.status === 'pending' && !isTaskOverdue(task));
    
    switch (chartType) {
      case 'monthly': {
        const monthlyData = getMonthlyData(tasks);
        const descriptions = monthlyData.map(month => 
          `${month.month}: ${month.completed} completed, ${month.pending} pending, ${month.overdue} overdue`
        );
        return `Monthly performance chart showing: ${descriptions.join('; ')}`;
      }
      
      case 'status': {
        const completedPercentage = totalTasks > 0 ? 
          Math.round((completedTasks.length / totalTasks) * 100) : 0;
        const overduePercentage = totalTasks > 0 ?
          Math.round((overdueTasks.length / totalTasks) * 100) : 0;
        const pendingPercentage = Math.max(0, 100 - completedPercentage - overduePercentage);

        return `Task status distribution: ${completedPercentage}% completed (${completedTasks.length} tasks), ${pendingPercentage}% pending (${pendingActiveTasks.length} tasks), ${overduePercentage}% overdue (${overdueTasks.length} tasks)`;
      }
      
      case 'type': {
        const typeDistribution = getTypeDistribution(tasks);
        const descriptions = Object.entries(typeDistribution).map(([type, count]) => 
          `${type}: ${count} tasks`
        );
        return `Task type distribution: ${descriptions.join(', ')}`;
      }
      
      default:
        return 'Chart showing task data visualization';
    }
  };

  const getMonthlyData = (tasks: Task[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString(undefined, { month: 'short' });
      
        const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getFullYear() === date.getFullYear() && 
               taskDate.getMonth() === date.getMonth();
      });

      months.push({
        month: monthName,
        completed: monthTasks.filter(task => task.status === 'completed').length,
        overdue: monthTasks.filter(isTaskOverdue).length,
        pending: monthTasks.filter(task => task.status === 'pending' && !isTaskOverdue(task)).length,
      });
    }
    
    return months;
  };

  const getTypeDistribution = (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const description = generateDescription();

  return (
    <div className="sr-only" aria-label={`Chart description: ${description}`}>
      {description}
    </div>
  );
};