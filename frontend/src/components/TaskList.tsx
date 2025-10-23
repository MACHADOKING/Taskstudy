import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Task, TaskAttachment } from '../services/taskService';
import { useTranslation } from '../hooks/useTranslation';
import type { TranslationKey } from '../utils/translations';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  loading?: boolean;
  onCreateNewTask?: () => void;
}

const Container = styled.div`
  background: ${(props) => props.theme.colors.white};
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.medium};
  overflow: hidden;
  margin: 0 0 1.5rem;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    border-radius: ${(props) => props.theme.borderRadius.medium};
  }

  @media (max-width: 480px) {
    border-radius: ${(props) => props.theme.borderRadius.small};
  }
`;

const Header = styled.div`
  background: ${(props) => props.theme.colors.primary};
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.9rem;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const TaskCount = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.65rem;
  border-radius: ${(props) => props.theme.borderRadius.small};
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
`;

const TitleGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    justify-content: space-between;
    width: 100%;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const InlineCreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.primary};
  color: #fff;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.22);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    width: 100%;
    justify-content: center;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.colors.backgroundLight};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 0.65rem 1rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.4rem 1rem;
  border-radius: ${(props) => props.theme.borderRadius.large};
  border: 1px solid
    ${(props) =>
      props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.white};
  color: ${(props) => (props.$active ? 'white' : props.theme.colors.text)};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.colors.primaryDark : props.theme.colors.hover};
    color: ${(props) => (props.$active ? 'white' : props.theme.colors.text)};
  }
`;

const TaskItem = styled.div<{ $priority: string; $completed: boolean }>`
  padding: 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  transition: background-color 0.2s ease;
  opacity: ${props => props.$completed ? 0.7 : 1};
  border-left: 4px solid ${props => {
    if (props.$completed) return props.theme.colors.success;
    switch (props.$priority) {
      case 'high': return props.theme.colors.error;
      case 'medium': return props.theme.colors.warning;
      case 'low': return props.theme.colors.info;
      default: return props.theme.colors.border;
    }
  }};

  &:hover {
    background: ${(props) => props.theme.colors.lightGray};
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 1.25rem 1rem;
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const TaskInfo = styled.div`
  flex: 1 1 360px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const TaskTitle = styled.h4<{ $completed: boolean }>`
  margin: 0 0 0.5rem 0;
  color: ${(props) => props.theme.colors.text};
  font-size: 1.1rem;
  text-decoration: ${props => props.$completed ? 'line-through' : 'none'};
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 0.65rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.span<{ $type?: 'subject' | 'type' | 'date' | 'priority' }>`
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 0.25rem;

  ${props => props.$type === 'priority' && `
    padding: 0.25rem 0.5rem;
    border-radius: ${props.theme.borderRadius.small};
    font-weight: 600;
    color: white;
    background: ${
      props.children === 'high' ? props.theme.colors.error :
      props.children === 'medium' ? props.theme.colors.warning :
      props.theme.colors.info
    };
  `}
`;

const TaskDescription = styled.p`
  color: ${(props) => props.theme.colors.textLight};
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const DetailsButton = styled.button`
  margin-top: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: ${(props) => props.theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    text-decoration: underline;
  }
`;

const TaskAttachments = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ModalTaskAttachments = styled(TaskAttachments)`
  margin-top: 0.75rem;
  gap: 0.5rem;
`;

const AttachmentsTitle = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AttachmentsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: stretch;
`;

const AttachmentChip = styled.li`
  display: inline-flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundLight};
  border: 1px solid ${(props) => props.theme.colors.border};
  max-width: 200px;
  flex: 0 1 180px;
`;

const AttachmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.2;

  a {
    color: ${(props) => props.theme.colors.primary};
    font-weight: 600;
    flex: 1;
    min-width: 0;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const AttachmentPreview = styled.div`
  width: 100%;
  height: 120px;
  border-radius: ${(props) => props.theme.borderRadius.small};
  overflow: hidden;
  background: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AttachmentImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const AttachmentEmbed = styled.embed`
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: ${(props) => props.theme.colors.white};
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
  min-width: 200px;
  align-self: center;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    flex-direction: column;
    min-width: 0;
    width: 100%;
    order: 3;
    margin-left: 0;
    align-self: stretch;
  }
`;

const ActionButton = styled.button<{ $variant: 'complete' | 'edit' | 'delete' }>`
  padding: 0.6rem 0.9rem;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.small};
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  flex: 1;

  ${props => {
    switch (props.$variant) {
      case 'complete':
        return `
          background: ${props.theme.colors.success};
          color: white;
          &:hover { background: ${props.theme.colors.successDark}; }
        `;
      case 'edit':
        return `
          background: ${props.theme.colors.info};
          color: white;
          &:hover { background: ${props.theme.colors.infoDark}; }
        `;
      case 'delete':
        return `
          background: ${props.theme.colors.error};
          color: white;
          &:hover { background: ${props.theme.colors.errorDark}; }
        `;
      default:
        return '';
    }
  }}

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    flex: 1 1 100%;
  }
`;

const ActionButtonIcon = styled.span`
  font-size: 0.9rem;
`;

const ActionButtonText = styled.span`
  white-space: nowrap;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    white-space: normal;
    text-align: center;
  }
`;

const DetailsOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1.5rem;
`;

const DetailsModal = styled.div`
  background: ${(props) => props.theme.colors.white};
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.large};
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const DetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const DetailsTitle = styled.h3`
  margin: 0;
  color: ${(props) => props.theme.colors.text};
  font-size: 1.25rem;
`;

const DetailsCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.textLight};
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.colors.text};
  }
`;

const DetailsBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DetailsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DetailsLabel = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const DetailsValue = styled.span`
  color: ${(props) => props.theme.colors.textLight};
`;

const DetailsDescription = styled.p`
  margin: 0;
  padding: 1rem;
  background: ${(props) => props.theme.colors.backgroundLight};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  color: ${(props) => props.theme.colors.text};
  line-height: 1.6;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textLight};
`;

const LoadingState = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textLight};
`;

const Pagination = styled.div`
  padding: 1rem 1.5rem;
  background: ${(props) => props.theme.colors.lightGray};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PaginationInfo = styled.span`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.9rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.text};
  border-radius: ${(props) => props.theme.borderRadius.small};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background: ${(props) => props.theme.colors.hover};
  }
`;

const DESCRIPTION_PREVIEW_LIMIT = 64;
const TAB_PANEL_ID = 'task-list-panel';
const ITEMS_PER_PAGE = 10;

type TaskFilter = 'pending' | 'completed' | 'all';

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  loading = false,
  onCreateNewTask,
}) => {
  const { t, language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.status !== 'completed').length,
    [tasks]
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === 'completed').length,
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return tasks.filter((task) => task.status !== 'completed');
      case 'completed':
        return tasks.filter((task) => task.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, activeFilter]);

  useEffect(() => {
    // Ensure the view falls back to all tasks once every task is completed.
    if (tasks.length === 0) {
      return;
    }

    const hasPending = tasks.some((task) => task.status !== 'completed');
    if (!hasPending && activeFilter === 'pending') {
      setActiveFilter('all');
    }
  }, [tasks, activeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const totalPages = Math.max(
    Math.ceil(filteredTasks.length / ITEMS_PER_PAGE),
    1
  );

  const renderAttachmentPreview = useCallback(
    (attachment: TaskAttachment | undefined, title: string) => {
      if (!attachment || !attachment.type || !attachment.data) {
        return null;
      }

      if (attachment.type.startsWith('image/')) {
        return (
          <AttachmentPreview>
            <AttachmentImage
              src={attachment.data}
              alt={`${title} - ${attachment.name}`}
            />
          </AttachmentPreview>
        );
      }

      if (attachment.type === 'application/pdf') {
        return (
          <AttachmentPreview>
            <AttachmentEmbed
              src={attachment.data}
              type="application/pdf"
              title={`${title} - ${attachment.name}`}
            />
          </AttachmentPreview>
        );
      }

      return null;
    },
    []
  );

  useEffect(() => {
    const maxPage = Math.max(
      Math.ceil(filteredTasks.length / ITEMS_PER_PAGE),
      1
    );

    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredTasks.length, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTask]);

  const tabOptions = useMemo(
    () => [
      {
        key: 'pending' as TaskFilter,
        label: t('tasksTabPending'),
        count: pendingCount,
      },
      {
        key: 'completed' as TaskFilter,
        label: t('tasksTabCompleted'),
        count: completedCount,
      },
      {
        key: 'all' as TaskFilter,
        label: t('tasksTabAll'),
        count: tasks.length,
      },
    ],
    [t, pendingCount, completedCount, tasks.length]
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '📝';
      case 'exam': return '📊';
      case 'reading': return '📚';
      default: return '📋';
    }
  };

  const getTypeTranslation = useCallback((type: string) => {
    switch (type) {
      case 'assignment': return t('typeAssignment');
      case 'exam': return t('typeExam');
      case 'reading': return t('typeReading');
      default: return type;
    }
  }, [t]);

  const getPriorityTranslation = useCallback((priority: string) => {
    switch (priority) {
      case 'low': return t('priorityLow');
      case 'medium': return t('priorityMedium');
      case 'high': return t('priorityHigh');
      default: return priority;
    }
  }, [t]);



  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    const locale = language === 'pt-BR' ? ptBR : enUS;
    const formatForLabel = (pattern: string) => format(date, pattern, { locale });

    const replacePlaceholders = (key: TranslationKey) => {
      let template = t(key);
      template = template.replace('{{date}}', formatForLabel(language === 'pt-BR' ? "d 'de' MMM" : 'MMM d'));
      template = template.replace('{{fullDate}}', formatForLabel(language === 'pt-BR' ? "d 'de' MMMM, yyyy" : 'MMM d, yyyy'));
      template = template.replace('{{time}}', formatForLabel(language === 'pt-BR' ? 'HH:mm' : 'p'));
      return template;
    };

    if (diffHours < 0) {
      return { text: replacePlaceholders('dueStatusOverdueWithDate'), urgent: true };
    }

    if (diffHours < 24) {
      return { text: replacePlaceholders('dueStatusTodayWithTime'), urgent: true };
    }

    if (diffHours < 48) {
      return { text: t('dueStatusTomorrow'), urgent: true };
    }

    return {
      text: replacePlaceholders('dueStatusOnDate'),
      urgent: false,
    };
  };

  const formatDetailDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const locale = language === 'pt-BR' ? ptBR : enUS;

      return format(
        date,
        language === 'pt-BR'
          ? "d 'de' MMMM yyyy 'às' HH:mm"
          : "MMM d, yyyy 'at' p",
        { locale }
      );
    },
    [language]
  );

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>📋 {t('tasksTitle')}</Title>
          {onCreateNewTask && (
            <HeaderRight>
              <InlineCreateButton
                type="button"
                onClick={onCreateNewTask}
                aria-label={t('newTask')}
              >
                ➕ {t('newTask')}
              </InlineCreateButton>
            </HeaderRight>
          )}
        </Header>
        <LoadingState>{t('loadingTasks')}</LoadingState>
      </Container>
    );
  }

  if (tasks.length === 0) {
    return (
      <Container>
        <Header>
          <Title>📋 {t('tasksTitle')}</Title>
          <HeaderRight>
            <TaskCount>0 {t('tasksCount')}</TaskCount>
            {onCreateNewTask && (
              <InlineCreateButton
                type="button"
                onClick={onCreateNewTask}
                aria-label={t('newTask')}
              >
                ➕ {t('newTask')}
              </InlineCreateButton>
            )}
          </HeaderRight>
        </Header>
        <EmptyState>
          <p>📝 {t('noTasksFound')}</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleGroup>
          <Title>📋 {t('tasksTitle')}</Title>
          <TaskCount>
            <span>{filteredTasks.length}</span>
            {filteredTasks.length !== tasks.length && (
              <>
                <span>/</span>
                <span>{tasks.length}</span>
              </>
            )}
            <span>{t('tasksCount')}</span>
          </TaskCount>
        </TitleGroup>
        {onCreateNewTask && (
          <HeaderRight>
            <InlineCreateButton
              type="button"
              onClick={onCreateNewTask}
              aria-label={t('newTask')}
            >
              ➕ {t('newTask')}
            </InlineCreateButton>
          </HeaderRight>
        )}
      </Header>

      <TabsContainer role="tablist" aria-label={t('tasksTitle')}>
        {tabOptions.map((tab) => (
          <TabButton
            key={tab.key}
            id={`task-tab-${tab.key}`}
            type="button"
            $active={activeFilter === tab.key}
            role="tab"
            aria-selected={activeFilter === tab.key}
            aria-controls={TAB_PANEL_ID}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label} ({tab.count})
          </TabButton>
        ))}
      </TabsContainer>

      {filteredTasks.length === 0 ? (
        <EmptyState
          role="tabpanel"
          id={TAB_PANEL_ID}
          aria-labelledby={`task-tab-${activeFilter}`}
        >
          <p>📝 {t('noTasksInFilter')}</p>
        </EmptyState>
      ) : (
        <div
          role="tabpanel"
          id={TAB_PANEL_ID}
          aria-labelledby={`task-tab-${activeFilter}`}
        >
          {currentTasks.map((task) => {
            const dueInfo = formatDueDate(task.dueDate);
            const isCompleted = task.status === 'completed';
            const description = task.description ?? '';
            const isDescriptionTruncated =
              description.length > DESCRIPTION_PREVIEW_LIMIT;
            const descriptionPreview = isDescriptionTruncated
              ? `${description
                  .slice(0, DESCRIPTION_PREVIEW_LIMIT)
                  .trimEnd()}...`
              : description;

            return (
              <TaskItem
                key={task.id}
                $priority={task.priority}
                $completed={isCompleted}
              >
                <TaskHeader>
                  <TaskInfo>
                    <TaskTitle $completed={isCompleted}>
                      {getTypeIcon(task.type)} {task.title}
                    </TaskTitle>

                    <TaskMeta>
                      <MetaItem $type="subject">
                        🏫 {task.subject}
                      </MetaItem>

                      <MetaItem $type="type">
                        {getTypeTranslation(task.type)}
                      </MetaItem>

                      <MetaItem
                        $type="date"
                        style={{
                          color: dueInfo.urgent ? '#E74C3C' : undefined,
                          fontWeight: dueInfo.urgent ? 'bold' : 'normal',
                        }}
                      >
                        📅 {dueInfo.text}
                      </MetaItem>

                      <MetaItem $type="priority">
                        {getPriorityTranslation(task.priority)}
                      </MetaItem>
                    </TaskMeta>

                    {description && (
                      <>
                        <TaskDescription>{descriptionPreview}</TaskDescription>
                        <DetailsButton
                          type="button"
                          onClick={() => setSelectedTask(task)}
                        >
                          {t('viewDetails')}
                        </DetailsButton>
                      </>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                      <TaskAttachments>
                        <AttachmentsTitle>
                          📎 {t('attachments')}
                        </AttachmentsTitle>
                        <AttachmentsList>
                          {task.attachments.map((attachment, index) => (
                            <AttachmentChip key={`${task.id}-attachment-${index}`}>
                              <AttachmentHeader>
                                <span aria-hidden="true">
                                  {attachment.type === 'application/pdf'
                                    ? '📄'
                                    : attachment.type?.startsWith('image/')
                                      ? '🖼️'
                                      : '📎'}
                                </span>
                                <a href={attachment.data} download={attachment.name}>
                                  {attachment.name}
                                </a>
                              </AttachmentHeader>
                              {renderAttachmentPreview(attachment, task.title)}
                            </AttachmentChip>
                          ))}
                        </AttachmentsList>
                      </TaskAttachments>
                    )}
                  </TaskInfo>

                  <ActionButtons>
                    <ActionButton
                      $variant="complete"
                      onClick={() => onToggleStatus(task.id, task.status)}
                      title={
                        isCompleted
                          ? t('markAsPending')
                          : t('markAsCompleted')
                      }
                    >
                      <ActionButtonIcon aria-hidden="true">
                        {isCompleted ? '↩️' : '✅'}
                      </ActionButtonIcon>
                      <ActionButtonText>
                        {isCompleted
                          ? t('markAsPending')
                          : t('markAsCompleted')}
                      </ActionButtonText>
                    </ActionButton>

                    <ActionButton
                      $variant="edit"
                      onClick={() => onEdit(task)}
                      title={t('editTaskTitle')}
                    >
                      <ActionButtonIcon aria-hidden="true">
                        ✏️
                      </ActionButtonIcon>
                      <ActionButtonText>{t('edit')}</ActionButtonText>
                    </ActionButton>

                    <ActionButton
                      $variant="delete"
                      onClick={() => onDelete(task.id)}
                      title={t('deleteTaskTitle')}
                    >
                      <ActionButtonIcon aria-hidden="true">
                        🗑️
                      </ActionButtonIcon>
                      <ActionButtonText>{t('delete')}</ActionButtonText>
                    </ActionButton>
                  </ActionButtons>
                </TaskHeader>
              </TaskItem>
            );
          })}

          {filteredTasks.length > ITEMS_PER_PAGE && totalPages > 1 && (
            <Pagination>
              <PaginationInfo>
                {t('showingTasks')} {startIndex + 1}-
                {Math.min(endIndex, filteredTasks.length)} {t('ofTasks')}{' '}
                {filteredTasks.length} {t('tasksCount')}
              </PaginationInfo>

              <PaginationButtons>
                <PaginationButton
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  {t('previous')}
                </PaginationButton>

                <PaginationButton
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  {t('next')}
                </PaginationButton>
              </PaginationButtons>
            </Pagination>
          )}
        </div>
      )}

      {selectedTask && (
        <DetailsOverlay onClick={() => setSelectedTask(null)}>
          <DetailsModal
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
            aria-describedby="task-details-description"
            onClick={(event) => event.stopPropagation()}
          >
            <DetailsHeader>
              <DetailsTitle id="task-details-title">
                {getTypeIcon(selectedTask.type)} {selectedTask.title}
              </DetailsTitle>
              <DetailsCloseButton
                type="button"
                onClick={() => setSelectedTask(null)}
                aria-label={t('close')}
              >
                ×
              </DetailsCloseButton>
            </DetailsHeader>

            <DetailsBody>
              <DetailsRow>
                <DetailsLabel>{t('subject')}</DetailsLabel>
                <DetailsValue>{selectedTask.subject}</DetailsValue>
              </DetailsRow>

              <DetailsRow>
                <DetailsLabel>{t('taskType')}</DetailsLabel>
                <DetailsValue>{getTypeTranslation(selectedTask.type)}</DetailsValue>
              </DetailsRow>

              <DetailsRow>
                <DetailsLabel>{t('priority')}</DetailsLabel>
                <DetailsValue>
                  {getPriorityTranslation(selectedTask.priority)}
                </DetailsValue>
              </DetailsRow>

              <DetailsRow>
                <DetailsLabel>{t('status')}</DetailsLabel>
                <DetailsValue>
                  {selectedTask.status === 'completed'
                    ? t('completed')
                    : t('pending')}
                </DetailsValue>
              </DetailsRow>

              <DetailsRow>
                <DetailsLabel>{t('dueDate')}</DetailsLabel>
                <DetailsValue>{formatDetailDate(selectedTask.dueDate)}</DetailsValue>
              </DetailsRow>

              <div>
                <DetailsLabel>{t('taskDescription')}</DetailsLabel>
                <DetailsDescription id="task-details-description">
                  {selectedTask.description || t('noDescriptionProvided')}
                </DetailsDescription>
              </div>

              {selectedTask.attachments &&
                selectedTask.attachments.length > 0 && (
                  <ModalTaskAttachments>
                    <AttachmentsTitle>
                      📎 {t('attachments')}
                    </AttachmentsTitle>
                    <AttachmentsList>
                      {selectedTask.attachments.map((attachment, index) => (
                        <AttachmentChip
                          key={`${selectedTask.id}-modal-attachment-${index}`}
                        >
                          <AttachmentHeader>
                            <span aria-hidden="true">
                              {attachment.type === 'application/pdf'
                                ? '📄'
                                : attachment.type?.startsWith('image/')
                                  ? '🖼️'
                                  : '📎'}
                            </span>
                            <a
                              href={attachment.data}
                              download={attachment.name}
                            >
                              {attachment.name}
                            </a>
                          </AttachmentHeader>
                          {renderAttachmentPreview(attachment, selectedTask.title)}
                        </AttachmentChip>
                      ))}
                    </AttachmentsList>
                  </ModalTaskAttachments>
                )}
            </DetailsBody>
          </DetailsModal>
        </DetailsOverlay>
      )}
    </Container>
  );
};