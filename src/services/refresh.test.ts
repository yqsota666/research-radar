import { describe, expect, it } from 'vitest';
import { createInitialState } from '../domain/radar';
import { runDemoRefresh, suggestRelatedTerms } from './refresh';

describe('demo refresh service', () => {
  it('updates stable source statuses and keeps WeChat as cached fallback', async () => {
    const refreshed = await runDemoRefresh(
      createInitialState(),
      '2026-07-13T06:00:00.000Z'
    );

    expect(refreshed.isRefreshing).toBe(false);
    expect(refreshed.lastUpdatedAt).toBe('2026-07-13T06:00:00.000Z');
    expect(refreshed.sourceStatuses.github.status).toBe('fetched');
    expect(refreshed.sourceStatuses.paper.status).toBe('fetched');
    expect(refreshed.sourceStatuses.wechat.status).toBe('cached');
    expect(refreshed.sourceStatuses.wechat.message).toContain('cached');
  });

  it('returns analyzed items with source-level fallback labels', async () => {
    const refreshed = await runDemoRefresh(createInitialState());

    expect(refreshed.items.some((item) => item.analysisStatus === 'done')).toBe(true);
    expect(refreshed.items.every((item) => item.scoreVersion === 'radar-v1')).toBe(true);
    expect(refreshed.items.some((item) => item.isCachedSample)).toBe(true);
  });

  it('suggests related terms for known and unknown keywords', () => {
    expect(suggestRelatedTerms('multi-agent')).toEqual([
      'tool use',
      'agent workflow',
      'agent benchmark'
    ]);
    expect(suggestRelatedTerms('robotics')).toEqual([
      'robotics survey',
      'robotics benchmark',
      'robotics implementation'
    ]);
  });
});
