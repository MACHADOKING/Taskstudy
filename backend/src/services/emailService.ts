import SibApiV3Sdk from 'sib-api-v3-sdk';

export interface PendingTaskDigestItem {
  title: string;
  subject: string;
  dueDate: Date;
  formattedDueDate: string;
  statusLabel: string;
  daysRemaining: number;
  priorityLabel: string;
  priorityScore: number;
  isCritical: boolean;
  isOverdue: boolean;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let cachedTransactionalApi: TransactionalEmailsApi | null = null;

const getTransactionalApi = (): TransactionalEmailsApi => {
  if (cachedTransactionalApi) {
    return cachedTransactionalApi;
  }

  const apiKey = process.env.SMTP_API ?? process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('Brevo API key is not configured. Provide SMTP_API (or BREVO_API_KEY).');
  }

  const apiClient = BrevoSdk.ApiClient.instance;
  apiClient.authentications['api-key'].apiKey = apiKey;

  cachedTransactionalApi = new BrevoSdk.TransactionalEmailsApi();
  return cachedTransactionalApi;
};

type SenderInfo = { name: string; email: string };
interface TransactionalEmailsApi {
  sendTransacEmail(payload: SendEmailPayload): Promise<unknown>;
}

interface SendEmailPayload {
  sender: SenderInfo;
  to: Array<{ email: string }>;
  subject: string;
  htmlContent: string;
}

type BrevoSdkModule = {
  ApiClient: { instance: { authentications: Record<string, { apiKey: string }> } };
  TransactionalEmailsApi: new () => TransactionalEmailsApi;
};

const BrevoSdk = SibApiV3Sdk as unknown as BrevoSdkModule;

const stripQuotes = (value: string): string => value.replace(/^['"]|['"]$/g, '').trim();

const resolveSender = (): SenderInfo => {
  const fallback: SenderInfo = {
    name: 'TaskStudy',
    email: process.env.SMTP_LOGIN ?? process.env.SMTP_USER ?? 'noreply@taskstudy.com',
  };

  const raw = process.env.SMTP_FROM?.trim();
  if (!raw) {
    return fallback;
  }

  const cleaned = stripQuotes(raw);
  const match = cleaned.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = stripQuotes(match[1]).trim() || fallback.name;
    return {
      name,
      email: match[2].trim(),
    };
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleaned)) {
    return {
      name: fallback.name,
      email: cleaned,
    };
  }

  return {
    name: cleaned,
    email: fallback.email,
  };
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transactionalApi = getTransactionalApi();
    const sender = resolveSender();

    const payload: SendEmailPayload = {
      sender,
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    await transactionalApi.sendTransacEmail(payload);

    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Generate task reminder email HTML
export const generateTaskReminderEmail = (
  userName: string,
  taskTitle: string,
  dueDate: Date,
  hoursRemaining: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .task-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4A90E2; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 TaskStudy Reminder</h1>
        </div>
        <div class="content">
          <h2>Hello, ${userName}!</h2>
          <p>This is a friendly reminder about your upcoming task:</p>
          <div class="task-info">
            <h3>📝 ${taskTitle}</h3>
            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
            <p><strong>Time Remaining:</strong> ${hoursRemaining} hours</p>
          </div>
          <p>Don't forget to complete your task on time! 🎯</p>
          <a href="${process.env.CLIENT_URL}/dashboard" class="button">View Dashboard</a>
        </div>
        <div class="footer">
          <p>You're receiving this email because you have an account on TaskStudy.</p>
          <p>&copy; 2024 TaskStudy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generatePendingTasksDigestEmail = (
  userName: string,
  summaryDate: Date,
  tasks: PendingTaskDigestItem[],
  highlights: PendingTaskDigestItem[]
): string => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const summaryLabel = `${formatDate(summaryDate)} às ${formatTime(summaryDate)}`;

  const highlightBlock = highlights.length
    ? `
        <div style="margin-top: 24px; padding: 16px; border-radius: 12px; background: linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(249, 115, 22, 0.12));">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #92400e;">Prioridades do dia</h3>
          <ul style="margin: 0; padding-left: 20px; color: #78350f;">
            ${highlights
              .map(
                (task) => `
              <li style="margin-bottom: 6px;">
                <strong>${task.title}</strong>
                <div style="font-size: 13px; opacity: 0.9;">${task.statusLabel} · Prioridade ${task.priorityLabel}</div>
              </li>`
              )
              .join('')}
          </ul>
        </div>`
    : '';

  const rows = tasks
    .map(
      (task) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${task.title}</strong>
            <div style="color: #6b7280; font-size: 13px;">${task.subject}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${task.formattedDueDate}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${task.statusLabel}
            <div style="color: #f97316; font-size: 12px; margin-top: 4px;">
              Prioridade ${task.priorityLabel}
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Resumo de Tarefas Pendentes - TaskStudy</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #111827; }
        .container { max-width: 640px; margin: 0 auto; padding: 24px; }
        .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.07); }
        .header { background: linear-gradient(135deg, #2563eb, #0ea5e9); color: #ffffff; padding: 28px 32px; }
        .header h1 { margin: 0; font-size: 26px; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px; }
        .content h2 { margin-top: 0; color: #1f2937; }
        .content p { color: #4b5563; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: #6b7280; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .actions { margin-top: 28px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff !important; border-radius: 999px; text-decoration: none; font-weight: 600; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.25); }
        .footer { padding: 24px 32px; background: #f9fafb; color: #6b7280; font-size: 13px; text-align: center; }
        @media (max-width: 600px) {
          .content { padding: 24px; }
          .header, .footer { padding: 20px 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>Olá, ${userName}! 👋</h1>
            <p>Resumo das suas tarefas pendentes · ${summaryLabel}</p>
          </div>
          <div class="content">
            <h2>Você tem ${tasks.length} tarefa${tasks.length > 1 ? 's' : ''} aguardando sua atenção.</h2>
            <p>
              Abaixo está a relação das próximas entregas e quanto tempo falta para cada uma.
              Planeje seu tempo e foque no que precisa ser feito hoje!
            </p>
            ${highlightBlock}
            <table>
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Prazo</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="actions">
              <a class="btn" href="${process.env.CLIENT_URL ?? ''}/dashboard" target="_blank" rel="noopener noreferrer">
                Abrir meu painel
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Você está recebendo este resumo porque possui tarefas pendentes registradas no TaskStudy.</p>
            <p>Organize seu tempo, finalize suas tarefas e continue evoluindo nos estudos! 💪</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export interface WeeklyReportEmailInput {
  userName: string;
  weekRangeLabel: string;
  created: number;
  completed: number;
  pending: number;
  completionRate: number;
  highlightSubjects: Array<{ subject: string; count: number }>;
  suggestions: string[];
}

export const generateWeeklyReportEmail = (input: WeeklyReportEmailInput): string => {
  const subjectList = input.highlightSubjects.length
    ? `<ul style="padding-left: 18px; margin: 12px 0;">
        ${input.highlightSubjects
          .map(
            (item) => `
              <li style="margin-bottom: 8px; color: #1f2937;">
                <strong>${item.subject}</strong>: ${item.count} tarefa${item.count > 1 ? 's' : ''} em foco
              </li>`
          )
          .join('')}
      </ul>`
    : '<p style="color: #4b5563;">Esta semana ficou bem distribuída entre suas matérias. Excelente equilíbrio! ✅</p>';

  const tipList = input.suggestions.length
    ? `<ol style="padding-left: 20px; margin: 12px 0; color: #1f2937;">
        ${input.suggestions
          .map((tip) => `<li style="margin-bottom: 10px;">${tip}</li>`)
          .join('')}
      </ol>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Relatório semanal - TaskStudy</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #0f172a; }
          .container { max-width: 680px; margin: 0 auto; padding: 24px; }
          .card { background: #ffffff; border-radius: 18px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); overflow: hidden; }
          .header { background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 32px 36px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; }
          .header p { margin-top: 8px; font-size: 15px; opacity: 0.9; }
          .content { padding: 32px 36px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin: 24px 0; }
          .stat-card { background: #f1f5f9; border-radius: 14px; padding: 16px; }
          .stat-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px; }
          .stat-value { font-size: 26px; font-weight: 700; color: #0f172a; }
          .badge { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 999px; background: rgba(79, 70, 229, 0.15); color: #4338ca; font-weight: 600; font-size: 13px; margin-top: 14px; }
          .footer { padding: 24px 36px; background: #f8fafc; color: #475569; font-size: 13px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>Seu painel semanal está pronto, ${input.userName.split(' ')[0]}! 📊</h1>
              <p>Período analisado: ${input.weekRangeLabel}</p>
            </div>
            <div class="content">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">Criadas</div>
                  <div class="stat-value">${input.created}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Concluídas</div>
                  <div class="stat-value">${input.completed}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Pendentes</div>
                  <div class="stat-value">${input.pending}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Taxa de conclusão</div>
                  <div class="stat-value">${Math.round(input.completionRate * 100)}%</div>
                </div>
              </div>
              <span class="badge">Resumo da semana</span>
              <p style="margin-top: 18px; line-height: 1.6; color: #1e293b;">
                Excelente! Você manteve o foco e encerrou importantes etapas nesta semana.
                Aqui vão os tópicos que merecem atenção especial:
              </p>
              ${subjectList}
              ${tipList}
            </div>
            <div class="footer">
              <p>Continue registrando suas conquistas. Nós avisaremos quando algo precisar da sua atenção! 💪</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export interface MonthlyPerformanceEmailInput {
  userName: string;
  monthLabel: string;
  created: number;
  completed: number;
  pending: number;
  completionRate: number;
  averageCompletionHours?: number;
  bestDay?: { label: string; completions: number };
  focusAreas: Array<{ subject: string; pending: number }>;
  achievements: string[];
}

export const generateMonthlyPerformanceEmail = (
  input: MonthlyPerformanceEmailInput
): string => {
  const focusList = input.focusAreas.length
    ? `<ul style="padding-left: 18px; margin: 12px 0;">
        ${input.focusAreas
          .map(
            (item) => `
              <li style="margin-bottom: 8px; color: #0f172a;">
                <strong>${item.subject}</strong>: ${item.pending} tarefa${item.pending > 1 ? 's' : ''} esperando conclusão
              </li>`
          )
          .join('')}
      </ul>`
    : '<p style="color: #4b5563;">Você encerrou todas as tarefas abertas do mês. Excelente domínio! 🎉</p>';

  const achievementList = input.achievements.length
    ? `<ul style="padding-left: 18px; margin: 12px 0;">
        ${input.achievements
          .map((item) => `<li style="margin-bottom: 8px; color: #334155;">${item}</li>`)
          .join('')}
      </ul>`
    : '';

  const avgBlock = input.averageCompletionHours
    ? `<div style="margin-top: 18px; padding: 16px; border-radius: 12px; background: rgba(59, 130, 246, 0.12); color: #1d4ed8;">
        Tempo médio para concluir tarefas: <strong>${Math.round(input.averageCompletionHours)} horas</strong>
      </div>`
    : '';

  const bestDayBlock = input.bestDay
    ? `<div style="margin-top: 12px; padding: 16px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #047857;">
        Dia de melhor desempenho: <strong>${input.bestDay.label}</strong> (${input.bestDay.completions} conclusão${
        input.bestDay.completions > 1 ? 'es' : 'a'
      })
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Relatório mensal - TaskStudy</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f1f5f9; color: #0f172a; }
          .container { max-width: 720px; margin: 0 auto; padding: 28px; }
          .card { background: #ffffff; border-radius: 20px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12); overflow: hidden; }
          .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); padding: 36px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin-top: 10px; font-size: 15px; opacity: 0.85; }
          .content { padding: 36px; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 18px; margin: 26px 0; }
          .metric { background: #eff6ff; border-radius: 16px; padding: 18px; }
          .metric-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #3b82f6; margin-bottom: 6px; }
          .metric-value { font-size: 30px; font-weight: 700; color: #1d4ed8; }
          .footer { padding: 26px 36px; background: #f8fafc; color: #475569; font-size: 13px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>${input.userName.split(' ')[0]}, seu mês no TaskStudy 🚀</h1>
              <p>Visão geral do período: ${input.monthLabel}</p>
            </div>
            <div class="content">
              <div class="metrics">
                <div class="metric">
                  <div class="metric-label">Criadas</div>
                  <div class="metric-value">${input.created}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Concluídas</div>
                  <div class="metric-value">${input.completed}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Pendentes</div>
                  <div class="metric-value">${input.pending}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Taxa de conclusão</div>
                  <div class="metric-value">${Math.round(input.completionRate * 100)}%</div>
                </div>
              </div>
              ${avgBlock}
              ${bestDayBlock}
              <h2 style="margin-top: 28px; color: #0f172a;">Onde concentrar energia no próximo ciclo</h2>
              ${focusList}
              <h2 style="margin-top: 32px; color: #0f172a;">Seu quadro de conquistas</h2>
              ${achievementList}
            </div>
            <div class="footer">
              <p>Estamos aqui para lembrar do que importa e celebrar cada avanço com você! 🌟</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};