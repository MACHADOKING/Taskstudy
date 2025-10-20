import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Task } from '../services/taskService';
import { useTranslation } from '../hooks/useTranslation';
import { ChartAccessibility } from './ChartAccessibility';

interface TasksChartProps {
  tasks: Task[];
}

const ChartContainer = styled.div`
  background: ${(props) => props.theme.colors.white};
  padding: 1.5rem;
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.medium};
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  height: 300px;
`;

const ChartFooter = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors.borderLight};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ChartDescription = styled.p`
  margin: 0;
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.95rem;
`;

const LegendList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundSecondary};
  box-shadow: ${(props) => props.theme.shadows.small};
`;

const LegendColor = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: ${(props) => props.theme.borderRadius.round};
  background: ${(props) => props.$color};
  box-shadow: 0 0 0 2px ${(props) => props.theme.colors.white};
`;

const LegendLabel = styled.span`
  color: ${(props) => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.9rem;
`;

const LegendValue = styled.span`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.85rem;
`;

export const TasksChart: React.FC<TasksChartProps> = ({ tasks }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const chartColors = useMemo(() => ({
    completed: theme.colors.statusCompleted,
    pending: theme.colors.statusPending,
    overdue: theme.colors.danger,
    assignment: theme.colors.info,
    exam: theme.colors.warning,
    reading: theme.colors.secondary,
    tooltipBg: theme.colors.backgroundSecondary,
    tooltipBorder: theme.colors.border,
    tooltipText: theme.colors.text,
    grid: theme.colors.border,
    axis: theme.colors.text,
  }), [theme.colors]);

  const isTaskOverdue = (task: Task) => {
    if (task.status !== 'pending') return false;
    const dueTime = new Date(task.dueDate).getTime();
    return Number.isFinite(dueTime) && dueTime < Date.now();
  };
  // Prepare data for monthly performance chart
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === monthIndex;
      });

      const completed = monthTasks.filter(t => t.status === 'completed').length;
      const overdue = monthTasks.filter(isTaskOverdue).length;
      const pending = monthTasks.filter(t => t.status === 'pending' && !isTaskOverdue(t)).length;

      last6Months.push({
        month: monthName,
        completed,
        pending,
        overdue,
      });
    }

    return last6Months;
  };

  // Prepare data for status pie chart
  const getStatusData = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(isTaskOverdue).length;
    const pending = tasks.filter(t => t.status === 'pending' && !isTaskOverdue(t)).length;

    return [
      { name: t('completedChart'), value: completed, color: chartColors.completed },
      { name: t('pendingChart'), value: pending, color: chartColors.pending },
      { name: t('overdueChart'), value: overdue, color: chartColors.overdue },
    ];
  };

  // Prepare data for type distribution
  const getTypeData = () => {
    const typeLabels: Record<Task['type'], string> = {
      assignment: t('typeAssignment'),
      exam: t('typeExam'),
      reading: t('typeReading'),
    };

    const types: Task['type'][] = ['assignment', 'exam', 'reading'];
    return types.map((type) => ({
      name: typeLabels[type],
      value: tasks.filter(t => t.type === type).length,
      color: chartColors[type],
    }));
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();
  const typeData = getTypeData();
  const monthlyTotals = monthlyData.reduce(
    (acc, month) => ({
      completed: acc.completed + month.completed,
      pending: acc.pending + month.pending,
      overdue: acc.overdue + month.overdue,
    }),
    { completed: 0, pending: 0, overdue: 0 }
  );
  const totalTasks = tasks.length;

  return (
    <>
      <ChartContainer>
        <ChartTitle>📊 {t('monthlyPerformanceChart')}</ChartTitle>
        <ChartAccessibility tasks={tasks} chartType="monthly" />
        <ChartSection>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData}
              aria-label="Monthly performance bar chart"
              role="img"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="month" tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={{ stroke: chartColors.grid }} />
              <YAxis tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={{ stroke: chartColors.grid }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: '8px',
                  color: chartColors.tooltipText,
                }}
                itemStyle={{ color: chartColors.tooltipText }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Bar dataKey="completed" fill={chartColors.completed} name={t('completedChart')} />
              <Bar dataKey="pending" fill={chartColors.pending} name={t('pendingChart')} />
              <Bar dataKey="overdue" fill={chartColors.overdue} name={t('overdueChart')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
        <ChartFooter>
          <ChartDescription>{t('chartMonthlyDescription')}</ChartDescription>
          <LegendList>
            <LegendItem>
              <LegendColor $color={chartColors.completed} />
              <LegendLabel>{t('completedChart')}</LegendLabel>
              <LegendValue>{monthlyTotals.completed} {t('tasksCount')}</LegendValue>
            </LegendItem>
            <LegendItem>
              <LegendColor $color={chartColors.pending} />
              <LegendLabel>{t('pendingChart')}</LegendLabel>
              <LegendValue>{monthlyTotals.pending} {t('tasksCount')}</LegendValue>
            </LegendItem>
            <LegendItem>
              <LegendColor $color={chartColors.overdue} />
              <LegendLabel>{t('overdueChart')}</LegendLabel>
              <LegendValue>{monthlyTotals.overdue} {t('tasksCount')}</LegendValue>
            </LegendItem>
          </LegendList>
        </ChartFooter>
      </ChartContainer>

      <ChartsGrid>
        <ChartContainer>
          <ChartTitle>📈 {t('taskStatusChart')}</ChartTitle>
          <ChartAccessibility tasks={tasks} chartType="status" />
          <ChartSection>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart role="img" aria-label="Task status distribution pie chart">
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',  
                    color: chartColors.tooltipText,
                  }}
                  itemStyle={{ color: chartColors.tooltipText }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartSection>
          <ChartFooter>
            <ChartDescription>{t('chartStatusDescription')}</ChartDescription>
            <LegendList>
              {statusData.map((entry) => (
                <LegendItem key={entry.name}>
                  <LegendColor $color={entry.color} />
                  <LegendLabel>{entry.name}</LegendLabel>
                  <LegendValue>{entry.value} {t('tasksCount')}</LegendValue>
                </LegendItem>
              ))}
            </LegendList>
          </ChartFooter>
        </ChartContainer>

        <ChartContainer>
          <ChartTitle>📚 {t('taskTypesChart')}</ChartTitle>
          <ChartAccessibility tasks={tasks} chartType="type" />
          <ChartSection>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart role="img" aria-label="Task types distribution donut chart">
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                  }}
                  itemStyle={{ color: chartColors.tooltipText }}
                  labelStyle={{ color: chartColors.tooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartSection>
          <ChartFooter>
            <ChartDescription>{t('chartTypeDescription')}</ChartDescription>
            <LegendList>
              {typeData.map((entry) => (
                <LegendItem key={entry.name}>
                  <LegendColor $color={entry.color} />
                  <LegendLabel>{entry.name}</LegendLabel>
                  <LegendValue>{entry.value} {t('tasksCount')}</LegendValue>
                </LegendItem>
              ))}
            </LegendList>
            <LegendValue style={{ fontWeight: 600 }}>
              {t('totalTasksLabel')}: {totalTasks}
            </LegendValue>
          </ChartFooter>
        </ChartContainer>
      </ChartsGrid>
    </>
  );
};