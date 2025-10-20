import { OAuth2Client, TokenPayload } from 'google-auth-library';

let cachedClient: OAuth2Client | null = null;

const getClient = (): OAuth2Client => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  if (!cachedClient) {
    cachedClient = new OAuth2Client(clientId);
  }

  return cachedClient;
};

export const verifyGoogleIdToken = async (idToken: string): Promise<TokenPayload | null> => {
  try {
    const client = getClient();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload() ?? null;
  } catch (error) {
    console.error('Failed to verify Google ID token:', error);
    return null;
  }
};
