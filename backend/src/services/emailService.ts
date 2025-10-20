import nodemailer, { Transporter } from 'nodemailer';

export interface PendingTaskDigestItem {
  title: string;
  subject: string;
  dueDate: Date;
  formattedDueDate: string;
  statusLabel: string;
  daysRemaining: number;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let cachedTransporter: Transporter | null = null;

const resolveBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Create or reuse transporter with environment-based configuration
const getTransporter = (): Transporter => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = resolveBoolean(process.env.SMTP_SECURE, port === 465);

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured. Provide SMTP_USER and SMTP_PASS.');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        (process.env.SMTP_USER ? `TaskStudy <${process.env.SMTP_USER}>` : 'TaskStudy <noreply@taskstudy.com>'),
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

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
  tasks: PendingTaskDigestItem[]
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