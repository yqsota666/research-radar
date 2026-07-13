import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  getTodaySummary,
  getVisibleFeedItems,
  toggleSaved
} from './radar';
import type { FeedFilter } from './types';

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
