import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  getTodaySummary,
  getVisibleFeedItems,
  toggleSaved
} from './radar';
import type { FeedFilter } from './types';
import type { RadarItem } from './types';

function makeItem(id: string, matchedKeyword: string, relevanceScore: number): RadarItem {
  const now = '2026-07-13T00:00:00.000Z';
  return {
    id,
    externalId: id,
    title: `${matchedKeyword} ${id}`,
    sourceType: 'github',
    sourceName: 'GitHub',
    url: `https://example.com/${id}`,
    publishedAt: now,
    matchedKeyword,
    rawSnippet: `${matchedKeyword} raw snippet`,
    summary: `${matchedKeyword} summary`,
    tags: [matchedKeyword, 'demo', 'ranking'],
    relevanceScore,
    reason: `${matchedKeyword} reason`,
    saved: false,
    fetchedAt: now,
    sourceStatus: 'fetched',
    sourceUpdatedAt: now,
    analysisStatus: 'done',
    scoreVersion: 'radar-v1',
    isCachedSample: false,
    createdAt: now,
    updatedAt: now
  };
}

describe('Research Radar domain helpers', () => {
  it('creates a useful default demo state', () => {
    const state = createInitialState('2026-07-13T04:00:00.000Z');

    expect(state.keywords.map((keyword) => keyword.term)).toEqual([
      'LLM Agent',
      'RAG',
      'Diffusion'
    ]);
    expect(state.items.length).toBeGreaterThanOrEqual(6);
    expect(state.sourceStatuses.github.status).toBe('fetched');
    expect(state.lastUpdatedAt).toBe('2026-07-13T04:00:00.000Z');
  });

  it('filters and sorts feed items by source, query, and relevance score', () => {
    const state = createInitialState();
    const filter: FeedFilter = {
      sourceType: 'paper',
      query: 'agent',
      sortBy: 'relevance'
    };

    const items = getVisibleFeedItems(state.items, filter);

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.sourceType === 'paper')).toBe(true);
    expect(items[0].relevanceScore).toBeGreaterThanOrEqual(
      items[items.length - 1].relevanceScore
    );
  });

  it('summarizes Today metrics and high-confidence top matches', () => {
    const summary = getTodaySummary(createInitialState());

    expect(summary.totalItems).toBeGreaterThan(0);
    expect(summary.counts.github).toBeGreaterThan(0);
    expect(summary.counts.paper).toBeGreaterThan(0);
    expect(summary.topMatches).toHaveLength(5);
    expect(summary.topMatches.every((item) => item.relevanceScore >= 80)).toBe(
      true
    );
  });

  it('diversifies Top Matches when multiple keywords have tied high scores', () => {
    const state = createInitialState();
    state.items = [
      makeItem('agent-1', 'LLM Agent', 92),
      makeItem('agent-2', 'LLM Agent', 92),
      makeItem('agent-3', 'LLM Agent', 92),
      makeItem('rag-1', 'RAG', 92),
      makeItem('diffusion-1', 'Diffusion', 92)
    ];

    const keywords = getTodaySummary(state).topMatches.map((item) => item.matchedKeyword);

    expect(new Set(keywords).size).toBeGreaterThanOrEqual(3);
    expect(keywords.slice(0, 3)).toEqual(['LLM Agent', 'RAG', 'Diffusion']);
  });

  it('keeps clearly higher-score items ahead of diversity fill items', () => {
    const state = createInitialState();
    state.items = [
      makeItem('agent-1', 'LLM Agent', 98),
      makeItem('agent-2', 'LLM Agent', 97),
      makeItem('agent-3', 'LLM Agent', 96),
      makeItem('rag-1', 'RAG', 82),
      makeItem('diffusion-1', 'Diffusion', 81)
    ];

    const topMatches = getTodaySummary(state).topMatches;

    expect(topMatches[0].id).toBe('agent-1');
    expect(topMatches[1].id).toBe('agent-2');
    expect(topMatches.some((item) => item.matchedKeyword === 'RAG')).toBe(true);
  });

  it('toggles saved state without mutating the original list', () => {
    const state = createInitialState();
    const targetId = state.items[0].id;

    const savedItems = toggleSaved(state.items, targetId);
    const unsavedItems = toggleSaved(savedItems, targetId);

    expect(state.items[0].saved).toBe(false);
    expect(savedItems.find((item) => item.id === targetId)?.saved).toBe(true);
    expect(unsavedItems.find((item) => item.id === targetId)?.saved).toBe(false);
  });
});
