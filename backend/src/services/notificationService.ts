import cron from 'node-cron';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { prisma } from '../config/database';
import {
  sendEmail,
  generateTaskReminderEmail,
  generatePendingTasksDigestEmail,
  generateWeeklyReportEmail,
  generateMonthlyPerformanceEmail,
  PendingTaskDigestItem,
  WeeklyReportEmailInput,
  MonthlyPerformanceEmailInput,
} from './emailService';
import { sendTelegramMessage } from './telegramService';
import { sendWhatsAppMessage } from './whatsappService.js';
import { Prisma, Priority, Status, Task as PrismaTask, User as PrismaUser } from '@prisma/client';

const REMINDER_THRESHOLDS_HOURS = [24, 48, 72];
const DIGEST_LOOKAHEAD_DAYS = 7;
const DIGEST_PAST_WINDOW_DAYS = 30;

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const PRIORITY_SCORE: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const CRITICAL_WINDOW_DAYS = 2;

const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfWeek = (date: Date): Date => {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
};

const startOfMonth = (date: Date): Date => {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
};

const endOfWeek = (start: Date): Date => {
  const copy = new Date(start);
  copy.setDate(copy.getDate() + 6);
  return copy;
};

const startOfNextMonth = (date: Date): Date => {
  const copy = startOfMonth(date);
  copy.setMonth(copy.getMonth() + 1);
  return copy;
};

const formatWeekRangeLabel = (start: Date, end: Date): string => {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  });

  return `${formatter.format(start)} · ${formatter.format(end)}`;
};

const formatMonthLabel = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const findNotificationWithinRange = async (
  userId: string,
  types: string[],
  rangeStart: Date
): Promise<boolean> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).notification.findFirst({
    where: {
      userId,
      type: { in: types },
      createdAt: {
        gte: rangeStart,
      },
    },
  });

  return Boolean(existing);
};

const buildDigestItems = (tasks: PrismaTask[]): PendingTaskDigestItem[] => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = Date.now();
  const criticalThresholdMs = CRITICAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return tasks.map((task) => {
    const dueDate = new Date(task.dueDate);
    const diffMs = dueDate.getTime() - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let statusLabel: string;
    if (diffMs < 0) {
      statusLabel = 'Atrasada';
    } else if (daysRemaining === 0) {
      statusLabel = 'Entrega hoje';
    } else if (daysRemaining === 1) {
      statusLabel = 'Falta 1 dia';
    } else {
      statusLabel = `Faltam ${daysRemaining} dias`;
    }

    const priority = task.priority ?? Priority.MEDIUM;
    const priorityScore = PRIORITY_SCORE[priority];

    return {
      title: task.title,
      subject: task.subject,
      dueDate,
      formattedDueDate: dateFormatter.format(dueDate),
      statusLabel,
      daysRemaining,
      priorityLabel: PRIORITY_LABEL[priority],
      priorityScore,
      isCritical: diffMs <= criticalThresholdMs,
      isOverdue: diffMs < 0,
    } satisfies PendingTaskDigestItem;
  });
};

interface DailyDigestOptions {
  recipientOverride?: string;
  force?: boolean;
}

interface DailyDigestResult {
  status: 'sent' | 'skipped_no_tasks' | 'skipped_duplicate';
}

const resolveNotificationEmail = (user: PrismaUser): string => {
  if (user.notificationEmail && user.notificationEmail.trim().length > 0) {
    return user.notificationEmail.trim();
  }
  return user.email;
};

const sendDigestForUser = async (
  user: PrismaUser,
  options?: DailyDigestOptions
): Promise<DailyDigestResult> => {
  const now = new Date();
  const lookAheadLimit = new Date(now.getTime() + DIGEST_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
  const pastWindowLimit = new Date(now.getTime() - DIGEST_PAST_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.PENDING,
      dueDate: {
        gte: pastWindowLimit,
        lte: lookAheadLimit,
      },
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' },
    ],
  });

  if (!tasks.length) {
    return { status: 'skipped_no_tasks' };
  }

  if (!options?.force) {
    const alreadySent = await findNotificationWithinRange(
      user.id,
      ['DAILY_PENDING_TASKS', 'DAILY_SUMMARY'],
      startOfDay(now)
    );

    if (alreadySent) {
      return { status: 'skipped_duplicate' };
    }
  }

  const digestItems = buildDigestItems(tasks);
  const criticalHighlights = digestItems
    .filter((item) => item.isCritical || item.isOverdue)
    .slice(0, 3);
  const fallbackHighlights = criticalHighlights.length > 0 ? criticalHighlights : digestItems.slice(0, 3);

  const emailRecipient = options?.recipientOverride ?? resolveNotificationEmail(user);

  if (options?.recipientOverride || user.notifyByEmail) {
    const html = generatePendingTasksDigestEmail(user.name, now, digestItems, fallbackHighlights);
    await sendEmail({
      to: emailRecipient,
      subject: 'Resumo diário das suas tarefas pendentes',
      html,
    });
  }

  const highlightTitles = fallbackHighlights.map((task) => `• ${task.title} (${task.statusLabel} · prioridade ${task.priorityLabel})`).join('\n');
  const shortSummary =
    `Você tem ${digestItems.length} tarefa${digestItems.length > 1 ? 's' : ''} pendente${
      digestItems.length > 1 ? 's' : ''
    }.\n` +
    (fallbackHighlights.length
      ? `Fique de olho em:\n${highlightTitles}`
      : 'Bons estudos! Continue avançando no seu ritmo.');

  if (!options?.recipientOverride && user.consentGiven && user.notifyByTelegram && user.telegramChatId) {
    await sendTelegramMessage({
      chatId: user.telegramChatId,
      text: `Bom dia, ${user.name.split(' ')[0]}!\n\n${shortSummary}`,
    });
  }

  if (!options?.recipientOverride && user.consentGiven && user.notifyByWhatsApp && user.phone) {
    try {
      await sendWhatsAppMessage({
        to: user.phone,
        message: `TaskStudy · Resumo diário\n\n${shortSummary}`,
      });
    } catch (error) {
      console.error(`Falha ao enviar WhatsApp para ${user.phone}:`, error);
    }
  }

  // Persist notification entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).notification.create({
    data: {
      userId: user.id,
      type: 'DAILY_PENDING_TASKS',
      title: 'Resumo diário de tarefas',
      message: `Você possui ${digestItems.length} tarefas pendentes.`,
      payload: {
        count: digestItems.length,
        highlights: fallbackHighlights.map((task) => ({
          title: task.title,
          dueDate: task.dueDate,
          status: task.statusLabel,
          priority: task.priorityLabel,
        })),
      },
    },
  });

  return { status: 'sent' };
};

export interface DailyDigestBatchSummary {
  attempted: number;
  sent: number;
  skippedNoTasks: number;
  skippedDuplicate: number;
  errors: number;
}

export const sendPendingTasksDigest = async (
  recipientOverride?: string,
  options?: DailyDigestOptions
): Promise<DailyDigestBatchSummary> => {
  const whereClause: Prisma.UserWhereInput | undefined = recipientOverride
    ? {
        OR: [
          { email: recipientOverride },
          {
            notificationEmail: {
              equals: recipientOverride,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }
    : undefined;

  const users = await prisma.user.findMany({
    where: whereClause,
  });

  if (!users.length) {
    console.log('ℹ️ Nenhum usuário elegível encontrado para envio do resumo diário.');
    return {
      attempted: 0,
      sent: 0,
      skippedNoTasks: 0,
      skippedDuplicate: 0,
      errors: 0,
    };
  }

  let digestsSent = 0;
  let skippedNoTasks = 0;
  let skippedDuplicate = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const digestOptions: DailyDigestOptions | undefined = recipientOverride
        ? {
            ...options,
            recipientOverride,
            force: true,
          }
        : options;

      const result = await sendDigestForUser(
        user,
        digestOptions
      );
      if (result.status === 'sent') {
        digestsSent += 1;
      } else if (result.status === 'skipped_no_tasks') {
        skippedNoTasks += 1;
      } else if (result.status === 'skipped_duplicate') {
        skippedDuplicate += 1;
      }
    } catch (error) {
      console.error(
        `❌ Falha ao enviar resumo para ${user.email}:`,
        error
      );
      errors += 1;
    }
  }

  console.log(
    `📬 Resumos enviados: ${digestsSent}/${users.length} (sem tarefas: ${skippedNoTasks}, já enviados hoje: ${skippedDuplicate}, erros: ${errors})`
  );

  return {
    attempted: users.length,
    sent: digestsSent,
    skippedNoTasks,
    skippedDuplicate,
    errors,
  };
};

interface ReportBatchSummary {
  attempted: number;
  sent: number;
  skippedDuplicate: number;
  skippedEmpty: number;
  errors: number;
}

const computeSubjectBreakdown = (subjects: string[], limit = 3): Array<{ subject: string; count: number }> => {
  const counter = new Map<string, number>();
  subjects.forEach((subject) => {
    if (!subject) {
      return;
    }
    counter.set(subject, (counter.get(subject) ?? 0) + 1);
  });

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([subject, count]) => ({ subject, count }));
};

const buildWeeklySuggestions = (
  completionRate: number,
  pending: number,
  highlightSubjects: Array<{ subject: string; count: number }>
): string[] => {
  const tips: string[] = [];

  if (highlightSubjects.length) {
    const primary = highlightSubjects[0];
    tips.push(`Reserve um bloco extra para ${primary.subject} — ${primary.count} tarefa${primary.count > 1 ? 's' : ''} aguardam atenção.`);
  }

  if (completionRate < 0.6) {
    tips.push('Experimente dividir grandes tarefas em subtarefas menores para manter o ritmo de conclusão.');
  }

  if (pending > 0 && completionRate >= 0.6) {
    tips.push('Aproveite o embalo e finalize as pendências mais rápidas logo no início da semana.');
  }

  if (!tips.length) {
    tips.push('Mantenha sua agenda organizada — seu progresso consistente está rendendo resultados!');
  }

  return tips;
};

const sendWeeklyReportForUser = async (user: PrismaUser, now: Date): Promise<'sent' | 'skipped_duplicate' | 'skipped_empty'> => {
  const weekStart = startOfWeek(now);

  if (
    await findNotificationWithinRange(user.id, ['WEEKLY_REPORT'], weekStart)
  ) {
    return 'skipped_duplicate';
  }

  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const created = await prisma.task.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: weekStart,
        lt: nextWeekStart,
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.COMPLETED,
      updatedAt: {
        gte: weekStart,
        lt: nextWeekStart,
      },
    },
    select: {
      subject: true,
    },
  });

  const completed = completedTasks.length;

  const pendingTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.PENDING,
    },
    select: {
      subject: true,
    },
  });

  const pending = pendingTasks.length;

  if (created === 0 && completed === 0 && pending === 0) {
    return 'skipped_empty';
  }

  const completionRate = completed / Math.max(1, completed + pending);
  const highlightSubjects = computeSubjectBreakdown(pendingTasks.map((task) => task.subject));
  const suggestions = buildWeeklySuggestions(completionRate, pending, highlightSubjects);

  if (user.notifyByEmail) {
    const emailPayload: WeeklyReportEmailInput = {
      userName: user.name,
      weekRangeLabel: formatWeekRangeLabel(weekStart, endOfWeek(weekStart)),
      created,
      completed,
      pending,
      completionRate,
      highlightSubjects,
      suggestions,
    };

    await sendEmail({
      to: resolveNotificationEmail(user),
      subject: 'Seu relatório semanal do TaskStudy chegou',
      html: generateWeeklyReportEmail(emailPayload),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).notification.create({
    data: {
      userId: user.id,
      type: 'WEEKLY_REPORT',
      title: 'Resumo semanal disponível',
      message: `Criadas: ${created} · Concluídas: ${completed} · Pendentes: ${pending}`,
      payload: {
        created,
        completed,
        pending,
        completionRate,
        weekStart,
      },
    },
  });

  return 'sent';
};

export const sendWeeklyTaskReports = async (now = new Date()): Promise<ReportBatchSummary> => {
  const users = await prisma.user.findMany();

  if (!users.length) {
    return {
      attempted: 0,
      sent: 0,
      skippedDuplicate: 0,
      skippedEmpty: 0,
      errors: 0,
    };
  }

  let sent = 0;
  let skippedDuplicate = 0;
  let skippedEmpty = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const result = await sendWeeklyReportForUser(user, now);
      if (result === 'sent') {
        sent += 1;
      } else if (result === 'skipped_duplicate') {
        skippedDuplicate += 1;
      } else if (result === 'skipped_empty') {
        skippedEmpty += 1;
      }
    } catch (error) {
      errors += 1;
      console.error(`❌ Falha ao gerar relatório semanal para ${user.email}:`, error);
    }
  }

  console.log(
    `📊 Relatórios semanais: enviados=${sent}, duplicados=${skippedDuplicate}, sem dados=${skippedEmpty}, erros=${errors}`
  );

  return {
    attempted: users.length,
    sent,
    skippedDuplicate,
    skippedEmpty,
    errors,
  };
};

const resolveTelegramChatId = (explicitChatId?: string): string => {
  if (explicitChatId && explicitChatId.trim().length > 0) {
    return explicitChatId.trim();
  }

  const fallback = process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  throw new Error('Telegram chat ID not provided and TELEGRAM_DEFAULT_CHAT_ID is not set');
};

export const sendTelegramTestMessage = async (
  message: string,
  chatId?: string
): Promise<void> => {
  const resolvedChatId = resolveTelegramChatId(chatId);
  await sendTelegramMessage({ chatId: resolvedChatId, text: message, disableWebPagePreview: true });
};

// Check for tasks due soon and send reminders
export const checkTaskReminders = async (): Promise<void> => {
  try {
    for (const hours of REMINDER_THRESHOLDS_HOURS) {
      const tasks = await Task.findTasksDueSoon(hours);

      for (const task of tasks) {
        const user = await User.findById(task.userId);

        if (!user) {
          continue;
        }

        const emailHtml = generateTaskReminderEmail(
          user.name,
          task.title,
          task.dueDate,
          hours
        );

        await sendEmail({
          to: user.email,
          subject: `⏰ Lembrete: "${task.title}" vence em ${hours} horas`,
          html: emailHtml,
        });

        console.log(`📧 Lembrete enviado para ${user.email} | ${task.title}`);

        // Persist urgent alert notification
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).notification.create({
          data: {
            userId: user.id,
            type: 'URGENT_ALERT',
            title: `Tarefa próxima do prazo (${hours}h)`,
            message: `A tarefa "${task.title}" está perto do prazo.`,
            payload: { taskId: task.id, hours },
          },
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar lembretes de tarefas:', error);
  }
};

// Schedule cron job to run every hour
export const startNotificationScheduler = (): void => {
  cron.schedule('0 * * * *', async () => {
    console.log('🔔 Executando verificação de lembretes de tarefas...');
    await checkTaskReminders();
  });

  console.log('✅ Agendador de notificações iniciado');
};

const buildMonthlyAchievements = (
  completed: number,
  completionRate: number,
  averageCompletionHours?: number,
  bestDay?: { label: string; completions: number }
): string[] => {
  const achievements: string[] = [];

  if (completed > 0) {
    achievements.push(`Você finalizou ${completed} tarefa${completed > 1 ? 's' : ''} neste mês.`);
  }

  if (completionRate >= 0.8) {
    achievements.push('Excelente consistência! Você manteve uma taxa de conclusão acima de 80%.');
  } else if (completionRate >= 0.6) {
    achievements.push('Bom ritmo! Continue finalizando suas tarefas para bater novas metas.');
  }

  if (averageCompletionHours !== undefined) {
    achievements.push(`Tempo médio para concluir tarefas: ${Math.round(averageCompletionHours)} horas.`);
  }

  if (bestDay) {
    achievements.push(`Seu dia mais produtivo foi ${bestDay.label}, com ${bestDay.completions} conclusão${
      bestDay.completions > 1 ? 'es' : 'a'
    }.`);
  }

  if (!achievements.length) {
    achievements.push('Mantenha seus registros em dia para que possamos celebrar suas conquistas no próximo relatório!');
  }

  return achievements;
};

const sendMonthlyReportForUser = async (
  user: PrismaUser,
  now: Date
): Promise<'sent' | 'skipped_duplicate' | 'skipped_empty'> => {
  const monthStart = startOfMonth(now);

  if (await findNotificationWithinRange(user.id, ['MONTHLY_REPORT'], monthStart)) {
    return 'skipped_duplicate';
  }

  const nextMonthStart = startOfNextMonth(now);

  const created = await prisma.task.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: monthStart,
        lt: nextMonthStart,
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.COMPLETED,
      updatedAt: {
        gte: monthStart,
        lt: nextMonthStart,
      },
    },
    select: {
      subject: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const completed = completedTasks.length;

  const pendingTasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.PENDING,
    },
    select: {
      subject: true,
    },
  });

  const pending = pendingTasks.length;

  if (created === 0 && completed === 0 && pending === 0) {
    return 'skipped_empty';
  }

  let averageCompletionHours: number | undefined;
  if (completedTasks.length) {
    const totalHours = completedTasks.reduce((total, task) => {
      const createdAt = new Date(task.createdAt).getTime();
      const updatedAt = new Date(task.updatedAt).getTime();
      return total + (updatedAt - createdAt) / (1000 * 60 * 60);
    }, 0);
    averageCompletionHours = totalHours / completedTasks.length;
  }

  const completionsByWeekday = completedTasks.reduce<Record<number, number>>((acc, task) => {
    const day = new Date(task.updatedAt).getDay();
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  let bestDay: { label: string; completions: number } | undefined;
  const entries = Object.entries(completionsByWeekday);
  if (entries.length) {
    const [bestDayKey, completions] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    bestDay = {
      label: WEEKDAY_LABELS[Number(bestDayKey)],
      completions: Number(completions),
    };
  }

  const focusAreas = computeSubjectBreakdown(pendingTasks.map((task) => task.subject)).map(
    ({ subject, count }) => ({ subject, pending: count })
  );
  const completionRate = completed / Math.max(1, completed + pending);
  const achievements = buildMonthlyAchievements(completed, completionRate, averageCompletionHours, bestDay);

  if (user.notifyByEmail) {
    const emailPayload: MonthlyPerformanceEmailInput = {
      userName: user.name,
      monthLabel: formatMonthLabel(monthStart),
      created,
      completed,
      pending,
      completionRate,
      averageCompletionHours,
      bestDay,
      focusAreas,
      achievements,
    };

    await sendEmail({
      to: resolveNotificationEmail(user),
      subject: 'Seu relatório mensal do TaskStudy está pronto',
      html: generateMonthlyPerformanceEmail(emailPayload),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).notification.create({
    data: {
      userId: user.id,
      type: 'MONTHLY_REPORT',
      title: 'Resumo mensal concluído',
      message: `Criadas: ${created} · Concluídas: ${completed} · Pendentes: ${pending}`,
      payload: {
        created,
        completed,
        pending,
        completionRate,
        monthStart,
        bestDay,
      },
    },
  });

  return 'sent';
};

export const sendMonthlyPerformanceReports = async (now = new Date()): Promise<ReportBatchSummary> => {
  const users = await prisma.user.findMany();

  if (!users.length) {
    return {
      attempted: 0,
      sent: 0,
      skippedDuplicate: 0,
      skippedEmpty: 0,
      errors: 0,
    };
  }

  let sent = 0;
  let skippedDuplicate = 0;
  let skippedEmpty = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const result = await sendMonthlyReportForUser(user, now);
      if (result === 'sent') {
        sent += 1;
      } else if (result === 'skipped_duplicate') {
        skippedDuplicate += 1;
      } else {
        skippedEmpty += 1;
      }
    } catch (error) {
      errors += 1;
      console.error(`❌ Falha ao gerar relatório mensal para ${user.email}:`, error);
    }
  }

  console.log(
    `🗓️ Relatórios mensais: enviados=${sent}, duplicados=${skippedDuplicate}, sem dados=${skippedEmpty}, erros=${errors}`
  );

  return {
    attempted: users.length,
    sent,
    skippedDuplicate,
    skippedEmpty,
    errors,
  };
};

export interface SchedulerRunOptions {
  skipDaily?: boolean;
  forceDaily?: boolean;
  forceWeekly?: boolean;
  forceMonthly?: boolean;
}

export interface SchedulerRunSummary {
  executedAt: string;
  daily?: DailyDigestBatchSummary;
  weekly?: ReportBatchSummary | null;
  monthly?: ReportBatchSummary | null;
}

export const triggerScheduledNotifications = async (
  now = new Date(),
  options?: SchedulerRunOptions
): Promise<SchedulerRunSummary> => {
  const summary: SchedulerRunSummary = {
    executedAt: now.toISOString(),
  };

  if (!options?.skipDaily) {
    const dailyOptions = options?.forceDaily ? { force: true } : undefined;
    summary.daily = await sendPendingTasksDigest(undefined, dailyOptions);
  }

  const shouldRunWeekly = options?.forceWeekly ?? now.getDay() === 1;
  summary.weekly = shouldRunWeekly ? await sendWeeklyTaskReports(now) : null;

  const shouldRunMonthly = options?.forceMonthly ?? now.getDate() === 1;
  summary.monthly = shouldRunMonthly ? await sendMonthlyPerformanceReports(now) : null;

  return summary;
};