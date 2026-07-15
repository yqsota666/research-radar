import { describe, expect, it, vi } from 'vitest';
import type { RawSourceItem } from './sourceAdapters';
import { analyzeWithLlm } from './llmAnalysis';

const rawItem: RawSourceItem = {
  externalId: 'github:42',
  title: 'open-agent/runtime',
  url: 'https://github.com/open-agent/runtime',
  publishedAt: '2026-07-13T08:00:00.000Z',
  authorsOrOwner: 'open-agent',
  rawSnippet: 'Fast runtime for LLM agent tool use and research workflows.',
  sourceType: 'github',
  sourceName: 'GitHub',
  metadata: { stars: 1200, language: 'TypeScript' }
};

describe('LLM analysis service', () => {
  it('requests a lightweight structured analysis and parses the JSON response', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'A TypeScript runtime for agent research workflows.',
                  tags: ['LLM Agent', 'tool use', 'TypeScript'],
                  relevanceScore: 91,
                  reason: 'Directly matches LLM Agent tooling.'
                })
              }
            }
          ]
        })
      )
    );

    const result = await analyzeWithLlm(rawItem, 'LLM Agent', ['tool use'], {
      env: {
        VITE_OPENAI_API_KEY: 'sk-test-secret',
        VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1',
        VITE_OPENAI_MODEL: 'gpt-test-light'
      },
      fetcher,
      now: '2026-07-13T08:00:00.000Z'
    });

    expect(result.analysisStatus).toBe('done');
    expect(result.analysis.summary).toBe('A TypeScript runtime for agent research workflows.');
    expect(result.analysis.tags).toEqual(['LLM Agent', 'tool use', 'TypeScript']);
    expect(fetcher).toHaveBeenCalledWith(
      'https://gmncode.cn/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-secret',
          'Content-Type': 'application/json'
        })
      })
    );
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body.model).toBe('gpt-test-light');
    expect(body.reasoning_effort).toBe('low');
    expect(body.temperature).toBe(0.1);
    expect(JSON.stringify(result)).not.toContain('sk-test-secret');
  });

  it('falls back to deterministic analysis when LLM config is missing', async () => {
    const fetcher = vi.fn();

    const result = await analyzeWithLlm(rawItem, 'LLM Agent', ['tool use'], {
      env: {},
      fetcher
    });

    expect(result.analysisStatus).toBe('done');
    expect(result.source).toBe('heuristic');
    expect(result.analysis.tags).toContain('LLM Agent');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
