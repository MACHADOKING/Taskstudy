interface WhatsAppMessagePayload {
  to: string;
  message: string;
  previewUrl?: boolean;
}

const resolveWebhookUrl = (): string | undefined => {
  return process.env.WHATSAPP_WEBHOOK_URL;
};

const resolveAuthHeader = (): string | undefined => {
  const token = process.env.WHATSAPP_API_KEY;
  if (token && token.trim().length > 0) {
    return `Bearer ${token.trim()}`;
  }
  return undefined;
};

export const sendWhatsAppMessage = async (
  payload: WhatsAppMessagePayload
): Promise<void> => {
  const url = resolveWebhookUrl();

  if (!url) {
    console.warn(
      'WhatsApp webhook não configurado (WHATSAPP_WEBHOOK_URL ausente). Pulando envio para',
      payload.to
    );
    return;
  }

  if (!payload.to || payload.to.trim().length === 0) {
    throw new Error('Número de destino do WhatsApp é obrigatório');
  }

  if (!payload.message || payload.message.trim().length === 0) {
    throw new Error('Mensagem do WhatsApp é obrigatória');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const auth = resolveAuthHeader();
  if (auth) {
    headers.Authorization = auth;
  }

  const body = {
    to: payload.to,
    message: payload.message,
    previewUrl: payload.previewUrl ?? false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erro no envio para WhatsApp (status ${response.status}): ${errorText || response.statusText}`
    );
  }
};
