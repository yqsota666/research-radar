import { describe, expect, it } from 'vitest';
import { getLlmConfigStatus } from './llmConfig';

describe('LLM config status', () => {
  it('reports missing key without exposing secret values', () => {
    const status = getLlmConfigStatus({
      VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
    });

    expect(status.status).toBe('missing-key');
    expect(status.label).toBe('Missing API key');
    expect(status.safeBaseUrl).toBe('https://gmncode.cn/v1');
    expect(JSON.stringify(status)).not.toContain('sk-');
  });

  it('reports invalid base URL', () => {
    const status = getLlmConfigStatus({
      VITE_OPENAI_API_KEY: 'sk-test-secret',
      VITE_OPENAI_BASE_URL: 'not a url'
    });

    expect(status.status).toBe('invalid-base-url');
    expect(status.label).toBe('Invalid base URL');
    expect(JSON.stringify(status)).not.toContain('sk-test-secret');
  });

  it('reports configured status with a valid key and URL', () => {
    const status = getLlmConfigStatus({
      VITE_OPENAI_API_KEY: 'sk-test-secret',
      VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
    });

    expect(status.status).toBe('configured');
    expect(status.label).toBe('Configured');
    expect(status.safeBaseUrl).toBe('https://gmncode.cn/v1');
    expect(status.hasApiKey).toBe(true);
    expect(JSON.stringify(status)).not.toContain('sk-test-secret');
  });
});
