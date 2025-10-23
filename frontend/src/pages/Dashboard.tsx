import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { taskService, Task } from '../services/taskService';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { TasksChart } from '../components/TasksChart';
import { TaskForm } from '../components/TaskForm';
import { TaskList as TaskListComponent } from '../components/TaskList';
import { TaskFiltersComponent, TaskFilters } from '../components/TaskFilters';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
  background: ${(props) => props.theme.colors.background};
  min-height: 100vh;

  @media (max-width: 1024px) {
    padding: 1.75rem 1.75rem;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 1.5rem 1.25rem 2.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.75rem 2rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
  }
`;

const OverviewButton = styled.button`
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const OverviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px;
  z-index: 1000;
  overflow-y: auto;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 24px 16px;
  }
`;

const OverviewDialog = styled.div`
  width: min(520px, 100%);
  background: ${(props) => props.theme.colors.white};
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.large};
  padding: 28px;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  max-height: min(90vh, 620px);
  overflow-y: auto;

  @media (min-width: ${(props) => props.theme.breakpoints.tablet}) {
    max-height: none;
    overflow-y: visible;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 24px;
    gap: 18px;
  }

  @media (max-width: 480px) {
    padding: 20px 18px;
    border-radius: ${(props) => props.theme.borderRadius.medium};
  }
`;

const OverviewHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OverviewTitle = styled.h2`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
`;

const OverviewSubtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.textLight};
`;

const OverviewMetrics = styled.div`
  display: grid;
  gap: 12px;
`;

const OverviewMetric = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundSecondary};
  align-items: flex-start;
`;

const OverviewMetricIcon = styled.span`
  font-size: 1.4rem;
  line-height: 1;
`;

const OverviewMetricContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OverviewMetricLabel = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
`;

const OverviewMetricValue = styled.span`
  font-size: 1.2rem;
  font-weight: 800;
`;

const OverviewMetricDescription = styled.span`
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.textLight};
`;

const OverviewCloseButton = styled.button`
  align-self: flex-end;
  background: ${(props) => props.theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  padding: 0.65rem 1.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
  }
`;

const OverviewEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  color: ${(props) => props.theme.colors.textLight};
  padding: 24px;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundSecondary};
`;

const Title = styled.h1`
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color: string }>`
  background: ${(props) => props.theme.colors.white};
  padding: 1.5rem;
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.medium};
  border-left: 4px solid ${(props) => props.color};
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.9rem;
`;

const FloatingCreateButton = styled.button`
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors.primary};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.3);
  transition: background 0.3s ease, transform 0.2s ease;
  z-index: 1050;

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid ${(props) => props.theme.colors.accent};
    outline-offset: 3px;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    bottom: 20px;
    left: 20px;
  }
`;

const FloatingButtonIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: inherit;
  font-size: 1.9rem;
  font-weight: 600;
  line-height: 1;
`;



export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const closeOverviewButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: '',
    subject: '',
    type: '',
    priority: '',
    sortBy: 'dueDate',
    search: '',
    dueDateFrom: '',
    dueDateTo: ''
  });

  // Function to abbreviate user name
  const abbreviateName = (fullName: string): string => {
    if (!fullName) return '';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0];
    
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    // If first name has more than 1 character, show first letter + dot
    const firstInitial = firstName.length > 1 ? firstName.charAt(0) + '.' : firstName;
    
    return `${firstInitial} ${lastName}`;
  };

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const buildDateFilterValue = (value: string, endOfDay = false): string | undefined => {
        const parts = value.split('-').map(Number);
        if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
          return undefined;
        }

        const [year, month, day] = parts;
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (endOfDay) {
          date.setHours(23, 59, 59, 999);
        } else {
          date.setHours(0, 0, 0, 0);
        }

        return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
      };

      const filterParams: Record<string, string> = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.subject) filterParams.subject = filters.subject;
      if (filters.type) filterParams.type = filters.type;
      if (filters.sortBy) filterParams.sortBy = filters.sortBy;
      if (filters.priority) filterParams.priority = filters.priority;
      if (filters.dueDateFrom) {
        const formattedFrom = buildDateFilterValue(filters.dueDateFrom);
        if (formattedFrom) {
          filterParams.dueDateFrom = formattedFrom;
        }
      }
      if (filters.dueDateTo) {
        const formattedTo = buildDateFilterValue(filters.dueDateTo, true);
        if (formattedTo) {
          filterParams.dueDateTo = formattedTo;
        }
      }

      const data = await taskService.getTasks(filterParams);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter tasks based on search and priority (client-side filtering)
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.subject.toLowerCase().includes(searchLower)
      );
    }

    // Priority filter (client-side since backend doesn't handle it)
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    return filtered;
  }, [tasks, filters.search, filters.priority]);

  const isTaskOverdue = useCallback((task: Task) => {
    if (task.status !== 'pending') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return Number.isFinite(dueTime) && dueTime < Date.now();
  }, []);

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(isTaskOverdue);

  const overviewMetrics = useMemo(() => {
    const allTasks = tasks;
    const total = allTasks.length;
    const completed = allTasks.filter((task) => task.status === 'completed');
    const overdue = allTasks.filter(isTaskOverdue);
    const pendingActive = allTasks.filter(
      (task) => task.status === 'pending' && !isTaskOverdue(task)
    );
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentCompleted = completed.filter((task) => {
      const updatedAt = new Date(task.updatedAt).getTime();
      return Number.isFinite(updatedAt) && updatedAt >= sevenDaysAgo;
    });
    const dueSoonAll = pendingActive.filter((task) => {
      const dueDate = new Date(task.dueDate);
      const diffHours = (dueDate.getTime() - now) / (1000 * 60 * 60);
      return diffHours <= 72 && diffHours > 0;
    });

    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      total,
      completedCount: completed.length,
      overdueCount: overdue.length,
      pendingActiveCount: pendingActive.length,
      dueSoonCount: dueSoonAll.length,
      recentCompletedCount: recentCompleted.length,
      completionRate,
    };
  }, [isTaskOverdue, tasks]);

  const overviewItems = useMemo(() => {
    if (overviewMetrics.total === 0) {
      return [];
    }

    const completionDescription = t('overviewMetricCompletionDescription')
      .replace('{{completed}}', `${overviewMetrics.completedCount}`)
      .replace('{{total}}', `${overviewMetrics.total}`);
    const overdueDescription = t('overviewMetricOverdueDescription')
      .replace('{{overdue}}', `${overviewMetrics.overdueCount}`);
    const dueSoonDescription = t('overviewMetricDueSoonDescription')
      .replace('{{dueSoon}}', `${overviewMetrics.dueSoonCount}`);
    const recentDescription = t('overviewMetricRecentDescription')
      .replace('{{recent}}', `${overviewMetrics.recentCompletedCount}`);

    return [
      {
        icon: '✅',
        label: t('overviewMetricCompletion'),
        value: `${overviewMetrics.completionRate}%`,
        description: completionDescription,
      },
      {
        icon: '⏰',
        label: t('overviewMetricOverdue'),
        value: `${overviewMetrics.overdueCount}`,
        description: overdueDescription,
      },
      {
        icon: '📅',
        label: t('overviewMetricDueSoon'),
        value: `${overviewMetrics.dueSoonCount}`,
        description: dueSoonDescription,
      },
      {
        icon: '🚀',
        label: t('overviewMetricRecent'),
        value: `${overviewMetrics.recentCompletedCount}`,
        description: recentDescription,
      },
    ];
  }, [overviewMetrics, t]);

  // Get unique subjects for filter dropdown
  const subjects = useMemo(() => {
    return Array.from(new Set(tasks.map(task => task.subject))).sort();
  }, [tasks]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleOpenOverview = () => {
    setShowOverviewModal(true);
  };

  const handleCloseOverview = () => {
    setShowOverviewModal(false);
  };

  const handleTaskFormSubmit = (task: Task) => {
    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      // Add new task
      setTasks(prev => [task, ...prev]);
    }
    loadTasks(); // Refresh to ensure consistency
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const updatedTask = await taskService.toggleTaskStatus(taskId, currentStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      // Force refresh to ensure data consistency
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(t('updateTaskStatusError'));
    }
  };

  useEffect(() => {
    if (!showOverviewModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowOverviewModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showOverviewModal]);

  useEffect(() => {
    if (showOverviewModal) {
      closeOverviewButtonRef.current?.focus();
    }
  }, [showOverviewModal]);

  return (
    <Container>
      <main id="main-content" role="main" aria-label="Dashboard">
        <Header>
        <div>
          <Title>{t('welcomeBack')}, {abbreviateName(user?.name || '')}! 👋</Title>
          <Subtitle>{t('academicOverview')}</Subtitle>
        </div>
        <OverviewButton
          type="button"
          onClick={handleOpenOverview}
          aria-haspopup="dialog"
          aria-expanded={showOverviewModal}
        >
          🧭 {t('overviewButtonLabel')}
        </OverviewButton>
      </Header>

      <StatsGrid>
        <StatCard color="#F39C12">
          <StatValue>{pendingTasks.length}</StatValue>
          <StatLabel>{t('pendingTasksLabel')}</StatLabel>
        </StatCard>
        
        <StatCard color="#27AE60">
          <StatValue>{completedTasks.length}</StatValue>
          <StatLabel>{t('completedTasksLabel')}</StatLabel>
        </StatCard>

        <StatCard color="#DC2626">
          <StatValue>{overdueTasks.length}</StatValue>
          <StatLabel>{t('overdueTasks')}</StatLabel>
        </StatCard>
        
        <StatCard color="#4A90E2">
          <StatValue>{filteredTasks.length}</StatValue>
          <StatLabel>{t('totalTasksLabel')}</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Charts Section */}
      {tasks.length > 0 && <TasksChart tasks={filteredTasks} />}

      {/* Filters Section */}
      <TaskFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        subjects={subjects}
        collapsed={!filtersOpen}
        onToggleCollapse={() => setFiltersOpen((prev) => !prev)}
      />

      {/* Tasks List Section */}
      <TaskListComponent
        tasks={filteredTasks}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onToggleStatus={handleToggleTaskStatus}
        loading={loading}
        onCreateNewTask={handleCreateTask}
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleTaskFormSubmit}
        editingTask={editingTask}
      />

      <FloatingCreateButton
        type="button"
        onClick={handleCreateTask}
        aria-label={t('createNewTask')}
      >
        <FloatingButtonIcon aria-hidden>+</FloatingButtonIcon>
      </FloatingCreateButton>

      {showOverviewModal && (
        <OverviewOverlay onClick={handleCloseOverview} role="presentation">
          <OverviewDialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="overview-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <OverviewHeader>
              <OverviewTitle id="overview-dialog-title">{t('overviewModalTitle')}</OverviewTitle>
              <OverviewSubtitle>{t('overviewModalSubtitle')}</OverviewSubtitle>
            </OverviewHeader>

            {overviewMetrics.total === 0 ? (
              <OverviewEmptyState>
                <span role="img" aria-hidden>📝</span>
                <strong>{t('overviewEmptyStateTitle')}</strong>
                <span>{t('overviewEmptyStateDescription')}</span>
              </OverviewEmptyState>
            ) : (
              <OverviewMetrics>
                {overviewItems.map((item) => (
                  <OverviewMetric key={item.label}>
                    <OverviewMetricIcon aria-hidden>{item.icon}</OverviewMetricIcon>
                    <OverviewMetricContent>
                      <OverviewMetricLabel>{item.label}</OverviewMetricLabel>
                      <OverviewMetricValue>{item.value}</OverviewMetricValue>
                      <OverviewMetricDescription>{item.description}</OverviewMetricDescription>
                    </OverviewMetricContent>
                  </OverviewMetric>
                ))}
              </OverviewMetrics>
            )}

            <OverviewCloseButton
              ref={closeOverviewButtonRef}
              type="button"
              onClick={handleCloseOverview}
            >
              {t('overviewCloseButton')}
            </OverviewCloseButton>
          </OverviewDialog>
        </OverviewOverlay>
      )}
      </main>
    </Container>
  );
};