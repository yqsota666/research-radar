import { describe, expect, it } from 'vitest';
import { createInitialState } from '../domain/radar';
import type { SourceAdapter } from './sourceAdapters';
import { runLiveRefresh } from './liveRefresh';

const successAdapter: SourceAdapter = {
  sourceType: 'github',
  sourceName: 'GitHub',
  async fetch() {
    return {
      sourceType: 'github',
      sourceName: 'GitHub',
      fetchedAt: '2026-07-13T07:00:00.000Z',
      status: 'success',
      items: [
        {
          externalId: 'github:live-agent',
          title: 'live-agent/runtime',
          url: 'https://github.com/live-agent/runtime',
          publishedAt: '2026-07-13T07:00:00.000Z',
          authorsOrOwner: 'live-agent',
          rawSnippet: 'LLM Agent workflow runtime with tool use.',
          sourceType: 'github',
          sourceName: 'GitHub',
          metadata: { stars: 500 }
        },
        {
          externalId: 'github:duplicate-url',
          title: 'duplicate repo',
          url: 'https://github.com/live-agent/runtime',
          publishedAt: '2026-07-13T07:00:00.000Z',
          authorsOrOwner: 'live-agent',
          rawSnippet: 'Duplicate URL should be removed.',
          sourceType: 'github',
          sourceName: 'GitHub',
          metadata: { stars: 50 }
        }
      ]
    };
  }
};

const failedAdapter: SourceAdapter = {
  sourceType: 'paper',
  sourceName: 'arXiv',
  async fetch() {
    return {
      sourceType: 'paper',
      sourceName: 'arXiv',
      fetchedAt: '2026-07-13T07:00:00.000Z',
      status: 'failed',
      items: [],
      errorMessage: 'arXiv fetch failed: timeout'
    };
  }
};

describe('live refresh coordinator', () => {
  it('merges successful source items, deduplicates, and preserves saved state', async () => {
    const initial = createInitialState();
    const savedId = initial.items[0].id;
    initial.items[0] = { ...initial.items[0], saved: true };

    const refreshed = await runLiveRefresh(initial, {
      adapters: [successAdapter],
      now: '2026-07-13T07:00:00.000Z'
    });

    expect(refreshed.items.filter((item) => item.url === 'https://github.com/live-agent/runtime')).toHaveLength(1);
    expect(refreshed.items.find((item) => item.id === savedId)?.saved).toBe(true);
    expect(refreshed.sourceStatuses.github.status).toBe('fetched');
    expect(refreshed.sourceStatuses.wechat.status).toBe('cached');
  });

  it('keeps fallback data when one source fails', async () => {
    const refreshed = await runLiveRefresh(createInitialState(), {
      adapters: [successAdapter, failedAdapter],
      now: '2026-07-13T07:00:00.000Z'
    });

    expect(refreshed.sourceStatuses.paper.status).toBe('failed');
    expect(refreshed.sourceStatuses.paper.message).toContain('timeout');
    expect(refreshed.items.some((item) => item.isCachedSample)).toBe(true);
    expect(refreshed.items.some((item) => item.title === 'live-agent/runtime')).toBe(true);
  });

  it('refreshes every enabled keyword using only that keyword selected sources', async () => {
    const calls: Array<{ sourceName: string; keyword: string }> = [];
    const githubAdapter: SourceAdapter = {
      sourceType: 'github',
      sourceName: 'GitHub',
      async fetch(keyword) {
        calls.push({ sourceName: 'GitHub', keyword });
        return {
          sourceType: 'github',
          sourceName: 'GitHub',
          fetchedAt: '2026-07-13T08:00:00.000Z',
          status: 'success',
          items: [
            {
              externalId: `github:${keyword}`,
              title: `${keyword} repo`,
              url: `https://github.com/example/${keyword.toLowerCase().replaceAll(' ', '-')}`,
              publishedAt: '2026-07-13T08:00:00.000Z',
              authorsOrOwner: 'example',
              rawSnippet: `${keyword} implementation`,
              sourceType: 'github',
              sourceName: 'GitHub',
              metadata: {}
            }
          ]
        };
      }
    };
    const paperAdapter: SourceAdapter = {
      sourceType: 'paper',
      sourceName: 'arXiv',
      async fetch(keyword) {
        calls.push({ sourceName: 'arXiv', keyword });
        return {
          sourceType: 'paper',
          sourceName: 'arXiv',
          fetchedAt: '2026-07-13T08:00:00.000Z',
          status: 'success',
          items: [
            {
              externalId: `arxiv:${keyword}`,
              title: `${keyword} paper`,
              url: `https://arxiv.org/abs/${keyword.toLowerCase().replaceAll(' ', '-')}`,
              publishedAt: '2026-07-13T08:00:00.000Z',
              authorsOrOwner: 'researcher',
              rawSnippet: `${keyword} research`,
              sourceType: 'paper',
              sourceName: 'arXiv',
              metadata: {}
            }
          ]
        };
      }
    };
    const initial = createInitialState();
    initial.keywords = [
      {
        id: 'agent',
        term: 'LLM Agent',
        enabled: true,
        sources: ['github'],
        relatedTerms: []
      },
      {
        id: 'rag',
        term: 'RAG',
        enabled: true,
        sources: ['paper'],
        relatedTerms: []
      },
      {
        id: 'diffusion',
        term: 'Diffusion',
        enabled: false,
        sources: ['github', 'paper'],
        relatedTerms: []
      }
    ];

    const refreshed = await runLiveRefresh(initial, {
      adapters: [githubAdapter, paperAdapter],
      now: '2026-07-13T08:00:00.000Z'
    });

    expect(calls).toEqual([
      { sourceName: 'GitHub', keyword: 'LLM Agent' },
      { sourceName: 'arXiv', keyword: 'RAG' }
    ]);
    expect(refreshed.items.some((item) => item.title === 'LLM Agent repo' && item.matchedKeyword === 'LLM Agent')).toBe(true);
    expect(refreshed.items.some((item) => item.title === 'RAG paper' && item.matchedKeyword === 'RAG')).toBe(true);
  });
});
