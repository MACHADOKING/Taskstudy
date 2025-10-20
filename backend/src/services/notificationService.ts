import cron from 'node-cron';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { prisma } from '../config/database';
import {
  sendEmail,
  generateTaskReminderEmail,
  generatePendingTasksDigestEmail,
  PendingTaskDigestItem,
} from './emailService';
import { sendTelegramMessage } from './telegramService';
import { Status, Task as PrismaTask, User as PrismaUser } from '@prisma/client';

const REMINDER_THRESHOLDS_HOURS = [24, 48, 72];
const DIGEST_LOOKAHEAD_DAYS = 7;
const DIGEST_PAST_WINDOW_DAYS = 30;

const buildDigestItems = (tasks: PrismaTask[]): PendingTaskDigestItem[] => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = Date.now();

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

    return {
      title: task.title,
      subject: task.subject,
      dueDate,
      formattedDueDate: dateFormatter.format(dueDate),
      statusLabel,
      daysRemaining,
    } satisfies PendingTaskDigestItem;
  });
};

const sendDigestForUser = async (
  user: PrismaUser,
  recipientOverride?: string
): Promise<boolean> => {
  const now = new Date();
  const lookAheadLimit = new Date(
    now.getTime() + DIGEST_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000
  );
  const pastWindowLimit = new Date(
    now.getTime() - DIGEST_PAST_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: Status.PENDING,
      dueDate: {
        gte: pastWindowLimit,
        lte: lookAheadLimit,
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  if (!tasks.length) {
    return false;
  }

  const digestItems = buildDigestItems(tasks);
  const html = generatePendingTasksDigestEmail(user.name, now, digestItems);

  await sendEmail({
    to: recipientOverride ?? user.email,
    subject: 'Resumo diário de tarefas pendentes',
    html,
  });

  // Persist notification entry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).notification.create({
    data: {
      userId: user.id,
      type: 'DAILY_SUMMARY',
      title: 'Resumo diário de tarefas',
      message: `Você possui ${digestItems.length} tarefas pendentes.`,
      payload: { count: digestItems.length },
    },
  });

  return true;
};

export const sendPendingTasksDigest = async (
  recipientOverride?: string
): Promise<void> => {
  const users = await prisma.user.findMany();

  if (!users.length) {
    console.log('ℹ️ Nenhum usuário ativo encontrado para envio do resumo.');
    return;
  }

  let digestsSent = 0;

  for (const user of users) {
    try {
      const sent = await sendDigestForUser(user, recipientOverride);
      if (sent) {
        digestsSent += 1;
      }
    } catch (error) {
      console.error(
        `❌ Falha ao enviar resumo para ${user.email}:`,
        error
      );
    }
  }

  console.log(`📬 Resumos enviados: ${digestsSent}/${users.length}`);
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