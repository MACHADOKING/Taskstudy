import { Request, Response } from 'express';
import {
  SchedulerRunOptions,
  SchedulerRunSummary,
  triggerScheduledNotifications,
} from '../services/notificationService';

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
};

const resolveCronSecret = (): string | undefined => {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.trim().length === 0) {
    return undefined;
  }
  return secret.trim();
};

export const runScheduledNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const configuredSecret = resolveCronSecret();
    if (!configuredSecret) {
      res.status(503).json({
        success: false,
        message: 'CRON_SECRET não configurado no ambiente do servidor.',
      });
      return;
    }

    const providedSecret =
      (req.get('x-cron-secret') ?? req.query.secret ?? req.query.key)?.toString();

    if (!providedSecret || providedSecret !== configuredSecret) {
      res.status(401).json({
        success: false,
        message: 'Acesso não autorizado ao endpoint de cron.',
      });
      return;
    }

  const options: SchedulerRunOptions = {};

    if (parseBoolean(req.query.skipDaily) === true) {
      options.skipDaily = true;
    }

    const forceWeekly = parseBoolean(req.query.forceWeekly);
    if (forceWeekly !== undefined) {
      options.forceWeekly = forceWeekly;
    }

    const forceMonthly = parseBoolean(req.query.forceMonthly);
    if (forceMonthly !== undefined) {
      options.forceMonthly = forceMonthly;
    }

    const summary: SchedulerRunSummary = await triggerScheduledNotifications(
      new Date(),
      options
    );

    res.status(200).json({
      success: true,
      message: 'Execução de notificações agendada concluída',
      summary,
    });
  } catch (error) {
    console.error('Erro ao processar cron do Render:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao executar notificações agendadas',
    });
  }
};
