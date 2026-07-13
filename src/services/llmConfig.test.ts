import { describe, expect, it, vi } from 'vitest';
import { checkLlmGateway, getLlmConfigStatus } from './llmConfig';

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

  it('checks a configured gateway and reports connected without exposing the key', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [] })));

    const status = await checkLlmGateway(
      {
        VITE_OPENAI_API_KEY: 'sk-test-secret',
        VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
      },
      fetcher
    );

    expect(status.status).toBe('connected');
    expect(status.label).toBe('Connected');
    expect(fetcher).toHaveBeenCalledWith('https://gmncode.cn/v1/models', {
      headers: { Authorization: 'Bearer sk-test-secret' }
    });
    expect(JSON.stringify(status)).not.toContain('sk-test-secret');
  });

  it('reports last check failed when a configured gateway request fails', async () => {
    const fetcher = vi.fn(async () => new Response('nope', { status: 502 }));

    const status = await checkLlmGateway(
      {
        VITE_OPENAI_API_KEY: 'sk-test-secret',
        VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
      },
      fetcher
    );

    expect(status.status).toBe('last-check-failed');
    expect(status.label).toBe('Last check failed');
    expect(status.message).toContain('HTTP 502');
    expect(JSON.stringify(status)).not.toContain('sk-test-secret');
  });

  it('does not call the network when config is missing', async () => {
    const fetcher = vi.fn();

    const status = await checkLlmGateway({}, fetcher);

    expect(status.status).toBe('missing-key');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
