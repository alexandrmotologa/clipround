import crypto from 'node:crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidationResult {
  valid: boolean;
  user?: TelegramUserData;
  error?: string;
}

export function validateTelegramInitData(
  initData: string | undefined,
  botToken: string,
  isDemoMode = false
): ValidationResult {
  if (isDemoMode || !botToken || botToken === 'mock_token') {
    return {
      valid: true,
      user: {
        id: 999999,
        first_name: 'Studio',
        last_name: 'User',
        username: 'local_studio',
      },
    };
  }

  if (!initData) {
    return { valid: false, error: 'Missing initData' };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      return { valid: false, error: 'Missing hash in initData' };
    }

    params.delete('hash');
    const sortedKeys = Array.from(params.keys()).sort();
    const checkString = sortedKeys.map((k) => `${k}=${params.get(k)}`).join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { valid: false, error: 'Invalid hash signature' };
    }

    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : undefined;

    return { valid: true, user };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}
