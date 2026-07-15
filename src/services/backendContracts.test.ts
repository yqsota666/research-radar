import { describe, expect, it, vi } from 'vitest';
import { createInitialState, getTodaySummary, getVisibleFeedItems, toggleSaved } from '../domain/radar';
import { analyzeRawItem } from './analysis';
import { analyzeWithLlm } from './llmAnalysis';
import { checkLlmGateway, getLlmConfigStatus } from './llmConfig';
import { runLiveRefresh } from './liveRefresh';
import { runDemoRefresh, suggestRelatedTerms } from './refresh';
import { clearFeedCache, loadState, saveState } from './storage';
import type { SourceAdapter } from './sourceAdapters';

describe('backend service contracts', () => {
  it('keeps every service/domain entry point callable with local-safe inputs', async () => {
    const state = createInitialState('2026-07-13T08:00:00.000Z');
    const summary = getTodaySummary(state);
    const visible = getVisibleFeedItems(state.items, { query: '', sourceType: 'all', sortBy: 'relevance' });
    const toggled = toggleSaved(state.items, state.items[0].id);
    const relatedTerms = suggestRelatedTerms('LLM Agent');
    const demoRefreshed = await runDemoRefresh(state, '2026-07-13T08:05:00.000Z');
    const storage = new Map<string, string>();
    const storageLike: Storage = {
      length: 0,
      clear: vi.fn(() => storage.clear()),
      getItem: vi.fn((key) => storage.get(key) ?? null),
      key: vi.fn((index) => [...storage.keys()][index] ?? null),
      removeItem: vi.fn((key) => storage.delete(key)),
      setItem: vi.fn((key, value) => storage.set(key, value))
    };
    saveState(state, storageLike);
    const loaded = loadState(storageLike);
    const cleared = clearFeedCache({ ...state, items: toggled });
    const rawItem = {
      externalId: 'contract:1',
      title: 'LLM Agent workflow runtime',
      url: 'https://example.com/runtime',
      publishedAt: '2026-07-13T08:00:00.000Z',
      authorsOrOwner: 'example',
      rawSnippet: 'A tool-use runtime for LLM agent research workflows.',
      sourceType: 'github' as const,
      sourceName: 'GitHub',
      metadata: { language: 'TypeScript' }
    };
    const heuristic = analyzeRawItem(rawItem, 'LLM Agent', relatedTerms);
    const llmFallback = await analyzeWithLlm(rawItem, 'LLM Agent', relatedTerms, { env: {} });
    const config = getLlmConfigStatus({ VITE_OPENAI_API_KEY: 'sk-test-secret' });
    const gateway = await checkLlmGateway({ VITE_OPENAI_API_KEY: 'sk-test-secret' }, vi.fn(async () => new Response('{}')));
    const adapter: SourceAdapter = {
      sourceType: 'github',
      sourceName: 'GitHub',
      async fetch() {
        return {
          sourceType: 'github',
          sourceName: 'GitHub',
          status: 'success',
          fetchedAt: '2026-07-13T08:00:00.000Z',
          items: [rawItem]
        };
      }
    };
    const liveRefreshed = await runLiveRefresh(state, {
      adapters: [adapter],
      now: '2026-07-13T08:10:00.000Z',
      timeoutMs: 1000
    });

    expect(summary.topMatches).toHaveLength(5);
    expect(visible.length).toBeGreaterThan(0);
    expect(toggled[0].saved).toBe(!state.items[0].saved);
    expect(relatedTerms).toContain('tool use');
    expect(demoRefreshed.lastUpdatedAt).toBe('2026-07-13T08:05:00.000Z');
    expect(loaded.items).toHaveLength(state.items.length);
    expect(cleared.items.every((item) => item.saved)).toBe(true);
    expect(heuristic.tags).toContain('LLM Agent');
    expect(llmFallback.source).toBe('heuristic');
    expect(config.status).toBe('configured');
    expect(gateway.status).toBe('connected');
    expect(liveRefreshed.sourceStatuses.github.status).toBe('fetched');
  });
});
