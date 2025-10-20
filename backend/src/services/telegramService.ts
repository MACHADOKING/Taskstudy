interface TelegramMessagePayload {
  chatId: string;
  text: string;
  parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  disableNotification?: boolean;
  disableWebPagePreview?: boolean;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
}

const getBotToken = (): string => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
  return token;
};

const buildTelegramUrl = (method: string): string => {
  const token = getBotToken();
  return `https://api.telegram.org/bot${token}/${method}`;
};

export const sendTelegramMessage = async (
  payload: TelegramMessagePayload
): Promise<void> => {
  const { chatId, text, parseMode, disableNotification, disableWebPagePreview } = payload;

  if (!chatId) {
    throw new Error('Telegram chatId is required');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Message text is required');
  }

  const body = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    disable_notification: disableNotification ?? false,
    disable_web_page_preview: disableWebPagePreview ?? true,
  };

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(buildTelegramUrl('sendMessage'), requestInit);
  const json = (await response.json()) as TelegramApiResponse;

  if (!response.ok || !json.ok) {
    const errorDescription = json.description || response.statusText || 'Unknown error sending Telegram message';
    const details = `Telegram API error${json.error_code ? ` (${json.error_code})` : ''}: ${errorDescription}`;
    throw new Error(details);
  }
};
