import { createInitialState } from '../domain/radar';
import type { AppState, RadarItem } from '../domain/types';

const relatedTermMap: Record<string, string[]> = {
  'llm agent': ['multi-agent', 'tool use', 'workflow automation'],
  'multi-agent': ['tool use', 'agent workflow', 'agent benchmark'],
  rag: ['retrieval', 'vector database', 'grounded generation'],
  diffusion: ['image generation', 'latent diffusion', 'video model']
};

export function suggestRelatedTerms(keyword: string): string[] {
  const normalized = keyword.trim().toLowerCase();
  return (
    relatedTermMap[normalized] ?? [
      `${keyword.trim()} survey`,
      `${keyword.trim()} benchmark`,
      `${keyword.trim()} implementation`
    ]
  );
}

function mergeSavedState(nextItems: RadarItem[], previousItems: RadarItem[]): RadarItem[] {
  const savedIds = new Set(previousItems.filter((item) => item.saved).map((item) => item.id));
  return nextItems.map((item) => ({
    ...item,
    saved: savedIds.has(item.id) || item.saved
  }));
}

export async function runDemoRefresh(
  state: AppState,
  now = new Date().toISOString()
): Promise<AppState> {
  const refreshed = createInitialState(now);

  return {
    ...refreshed,
    keywords: state.keywords,
    items: mergeSavedState(refreshed.items, state.items),
    isRefreshing: false,
    lastUpdatedAt: now,
    sourceStatuses: {
      ...refreshed.sourceStatuses,
      news: {
        ...refreshed.sourceStatuses.news,
        status: 'fetched',
        message: 'News refreshed successfully',
        lastFetchedAt: now
      },
      paper: {
        ...refreshed.sourceStatuses.paper,
        status: 'fetched',
        message: 'arXiv refreshed successfully',
        lastFetchedAt: now
      },
      github: {
        ...refreshed.sourceStatuses.github,
        status: 'fetched',
        message: 'GitHub refreshed successfully',
        lastFetchedAt: now
      },
      huggingface: {
        ...refreshed.sourceStatuses.huggingface,
        status: 'fetched',
        message: 'Hugging Face refreshed successfully',
        lastFetchedAt: now
      },
      wechat: {
        ...refreshed.sourceStatuses.wechat,
        status: 'cached',
        message: 'Using cached demo data because WeChat crawling is unstable',
        lastFetchedAt: now
      }
    }
  };
}
