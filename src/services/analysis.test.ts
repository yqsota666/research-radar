import { describe, expect, it } from 'vitest';
import { analyzeRawItem } from './analysis';
import type { RawSourceItem } from './sourceAdapters';

const rawItem: RawSourceItem = {
  externalId: 'github:1',
  title: 'agent workflow runtime',
  url: 'https://github.com/example/agent-workflow',
  publishedAt: '2026-07-13T00:00:00Z',
  authorsOrOwner: 'example',
  rawSnippet: 'A runtime for LLM agent tool use and workflow automation.',
  sourceType: 'github',
  sourceName: 'GitHub',
  metadata: { stars: 100 }
};

describe('analysis service', () => {
  it('creates LLM-shaped analysis for a relevant raw item', () => {
    const result = analyzeRawItem(rawItem, 'LLM Agent', ['tool use']);

    expect(result.relevanceScore).toBeGreaterThanOrEqual(80);
    expect(result.summary).toContain('agent workflow runtime');
    expect(result.tags).toContain('LLM Agent');
    expect(result.reason).toContain('LLM Agent');
  });

  it('scores weak matches lower but still returns useful fields', () => {
    const result = analyzeRawItem(rawItem, 'Diffusion', ['video model']);

    expect(result.relevanceScore).toBeLessThan(80);
    expect(result.tags.length).toBeGreaterThanOrEqual(3);
    expect(result.reason).toContain('Diffusion');
  });
});
