import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendTelegramMessage } from '../services/telegramService';

interface TelegramChat {
  id: number;
  username?: string;
  type?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

const LINK_CODE_PATTERN = /TS-[A-Z0-9]{6}/i;

const normalizeChatId = (chatId: number): string => String(chatId);

const extractLinkCode = (text: string | undefined): string | null => {
  if (!text) {
    return null;
  }

  const match = text.toUpperCase().match(LINK_CODE_PATTERN);
  return match ? match[0] : null;
};

const buildStartMessage = (): string => {
  return (
    'Olá! 👋\n\n' +
    'Para conectar seu Telegram ao TaskStudy, siga estes passos:\n' +
    '1. Abra o painel TaskStudy em Configurações de Conta.\n' +
    '2. Ative o canal do Telegram nas preferências de notificação.\n' +
    '3. Copie o código exibido e envie aqui, por exemplo: TS-ABC123.\n\n' +
    'Assim que o código for validado, enviaremos os alertas de tarefas por aqui.'
  );
};

export const telegramWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const update = req.body as TelegramUpdate | undefined;
    if (!update) {
      res.status(200).json({ ok: true });
      return;
    }

    const message = update.message ?? update.edited_message;
    if (!message || !message.chat || typeof message.chat.id !== 'number') {
      res.status(200).json({ ok: true });
      return;
    }

    const chatId = normalizeChatId(message.chat.id);
    const textContent = message.text?.trim();

    if (!textContent || textContent.length === 0) {
      res.status(200).json({ ok: true });
      return;
    }

    const lowered = textContent.toLowerCase();

    if (lowered === '/start') {
      await sendTelegramMessage({ chatId, text: buildStartMessage() });
      res.status(200).json({ ok: true });
      return;
    }

    let linkCode: string | null = null;

    if (lowered.startsWith('/start ')) {
      const payload = textContent.slice(7).trim();
      linkCode = extractLinkCode(payload);

      if (!linkCode) {
        await sendTelegramMessage({
          chatId,
          text: 'Não reconheci esse código. Verifique nas configurações do TaskStudy e envie novamente no formato TS-ABC123.',
        });
        res.status(200).json({ ok: true });
        return;
      }
    } else {
      linkCode = extractLinkCode(textContent);
    }

    if (!linkCode) {
      await sendTelegramMessage({
        chatId,
        text: 'Não reconheci esse código. Verifique nas configurações do TaskStudy e envie novamente no formato TS-ABC123.',
      });
      res.status(200).json({ ok: true });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Cast prisma as any to bypass schema drift warnings until new migration runs everywhere
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchingUser = await (prisma as any).user.findFirst({
      where: { telegramLinkCode: linkCode },
      select: {
        id: true,
        name: true,
        consentGiven: true,
      },
    });

    if (!matchingUser) {
      await sendTelegramMessage({
        chatId,
        text: 'Código inválido ou expirado. Gere um novo código nas configurações de conta do TaskStudy e tente novamente.',
      });
      res.status(200).json({ ok: true });
      return;
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).user.update({
      where: { id: matchingUser.id },
      data: {
        telegramChatId: chatId,
        telegramLinkCode: null,
        telegramLinkCodeGeneratedAt: null,
        notifyByTelegram: matchingUser.consentGiven ? true : false,
      },
    });

    const displayName = typeof matchingUser.name === 'string' && matchingUser.name.trim().length > 0
      ? matchingUser.name.trim().split(' ')[0]
      : undefined;

    const confirmationMessage = displayName
      ? `Perfeito, ${displayName}! 🔔 Seu Telegram foi conectado. Enviaremos os avisos de tarefas por aqui.`
      : 'Perfeito! 🔔 Seu Telegram foi conectado. Enviaremos os avisos de tarefas por aqui.';

    await sendTelegramMessage({ chatId, text: confirmationMessage });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(200).json({ ok: true });
  }
};