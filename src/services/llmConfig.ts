export type LlmConfigState = 'missing-key' | 'invalid-base-url' | 'configured';

export interface LlmConfigStatus {
  status: LlmConfigState;
  label: string;
  hasApiKey: boolean;
  safeBaseUrl: string;
  message: string;
}

export type LlmEnv = Record<string, string | undefined>;

const defaultBaseUrl = 'https://gmncode.cn/v1';

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getLlmConfigStatus(env: LlmEnv = import.meta.env): LlmConfigStatus {
  const apiKey = env.VITE_OPENAI_API_KEY?.trim() ?? '';
  const baseUrl = env.VITE_OPENAI_BASE_URL?.trim() || defaultBaseUrl;
  const hasApiKey = apiKey.length > 0;

  if (!isValidUrl(baseUrl)) {
    return {
      status: 'invalid-base-url',
      label: 'Invalid base URL',
      hasApiKey,
      safeBaseUrl: baseUrl,
      message: 'Set VITE_OPENAI_BASE_URL to a valid HTTP(S) URL.'
    };
  }

  if (!hasApiKey) {
    return {
      status: 'missing-key',
      label: 'Missing API key',
      hasApiKey: false,
      safeBaseUrl: baseUrl,
      message: 'Set VITE_OPENAI_API_KEY locally to enable gateway analysis.'
    };
  }

  return {
    status: 'configured',
    label: 'Configured',
    hasApiKey: true,
    safeBaseUrl: baseUrl,
    message: 'Gateway configuration is present. The key value is not displayed.'
  };
}
