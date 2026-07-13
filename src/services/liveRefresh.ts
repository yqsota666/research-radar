import { createDemoItems } from '../domain/demoData';
import type { AppState, RadarItem, SourceStatus, SourceType } from '../domain/types';
import { analyzeRawItem } from './analysis';
import {
  stableSourceAdapters,
  type RawSourceItem,
  type SourceAdapter,
  type SourceFetchResult
} from './sourceAdapters';

export interface LiveRefreshOptions {
  adapters?: SourceAdapter[];
  now?: string;
  fetcher?: typeof fetch;
}

interface RefreshJob {
  adapter: SourceAdapter;
  keyword: string;
  relatedTerms: string[];
}

const sourceLabels: Record<SourceType, string> = {
  news: 'Technology News',
  paper: 'Academic Papers',
  github: 'GitHub',
  huggingface: 'Hugging Face',
  wechat: 'Machine Heart / WeChat'
};

function makeId(item: RawSourceItem): string {
  return `${item.sourceType}-${item.externalId}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '').toLowerCase();
}

function rawToRadarItem(
  raw: RawSourceItem,
  keyword: string,
  relatedTerms: string[],
  fetchedAt: string
): RadarItem {
  const analysis = analyzeRawItem(raw, keyword, relatedTerms);
  return {
    id: makeId(raw),
    externalId: raw.externalId,
    title: raw.title,
    sourceType: raw.sourceType,
    sourceName: raw.sourceName,
    url: raw.url,
    publishedAt: raw.publishedAt,
    matchedKeyword: keyword,
    rawSnippet: raw.rawSnippet,
    summary: analysis.summary,
    tags: analysis.tags,
    relevanceScore: analysis.relevanceScore,
    reason: analysis.reason,
    saved: false,
    fetchedAt,
    sourceStatus: 'fetched',
    sourceUpdatedAt: fetchedAt,
    analysisStatus: 'done',
    scoreVersion: 'radar-v1',
    isCachedSample: false,
    createdAt: fetchedAt,
    updatedAt: fetchedAt
  };
}

function dedupe(items: RadarItem[]): RadarItem[] {
  const seen = new Set<string>();
  const deduped: RadarItem[] = [];
  for (const item of items) {
    const key = item.externalId || normalizeUrl(item.url) || `${item.sourceType}:${item.title}`;
    const urlKey = normalizeUrl(item.url);
    if (seen.has(key) || seen.has(urlKey)) continue;
    seen.add(key);
    seen.add(urlKey);
    deduped.push(item);
  }
  return deduped;
}

function preserveSaved(nextItems: RadarItem[], previousItems: RadarItem[]): RadarItem[] {
  const savedById = new Map(previousItems.filter((item) => item.saved).map((item) => [item.id, item]));
  const savedUrls = new Set(previousItems.filter((item) => item.saved).map((item) => normalizeUrl(item.url)));
  const merged = nextItems.map((item) => ({
    ...item,
    saved: savedById.has(item.id) || savedUrls.has(normalizeUrl(item.url)) || item.saved
  }));
  const missingSaved = [...savedById.values()].filter(
    (saved) => !merged.some((item) => item.id === saved.id || normalizeUrl(item.url) === normalizeUrl(saved.url))
  );
  return [...merged, ...missingSaved];
}

function statusFromResults(sourceType: SourceType, results: SourceFetchResult[]): SourceStatus {
  const newest = results.at(-1);
  const failed = results.filter((result) => result.status === 'failed');
  const cached = results.filter((result) => result.status === 'cached');
  const totalItems = results.reduce((sum, result) => sum + result.items.length, 0);
  const status =
    failed.length === results.length ? 'failed' : cached.length > 0 ? 'cached' : 'fetched';
  const sourceName = newest?.sourceName ?? sourceLabels[sourceType];

  return {
    sourceType,
    label: sourceLabels[sourceType],
    status,
    message:
      status === 'failed'
        ? failed[0]?.errorMessage ?? `${sourceName} failed`
        : status === 'cached'
          ? `${sourceName} using cached fallback with ${totalItems} item${totalItems === 1 ? '' : 's'}`
          : `${sourceName} returned ${totalItems} item${totalItems === 1 ? '' : 's'}`,
    lastFetchedAt: newest?.fetchedAt,
    nextRetryAt: newest?.nextRetryAt
  };
}

function fallbackItems(now: string): RadarItem[] {
  return createDemoItems(now).filter((item) => item.isCachedSample || item.sourceType === 'huggingface');
}

export async function runLiveRefresh(
  state: AppState,
  options: LiveRefreshOptions = {}
): Promise<AppState> {
  const now = options.now ?? new Date().toISOString();
  const adapters = options.adapters ?? stableSourceAdapters;
  const adaptersBySource = new Map(adapters.map((adapter) => [adapter.sourceType, adapter]));
  const enabledKeywords = state.keywords.filter((keyword) => keyword.enabled);
  const refreshJobs: RefreshJob[] = enabledKeywords.flatMap((keyword) =>
    keyword.sources.flatMap((sourceType) => {
      const adapter = adaptersBySource.get(sourceType);
      return adapter
        ? [
            {
              adapter,
              keyword: keyword.term,
              relatedTerms: keyword.relatedTerms
            }
          ]
        : [];
    })
  );

  const results = await Promise.all(
    refreshJobs.map(async (job) => ({
      keyword: job.keyword,
      relatedTerms: job.relatedTerms,
      result: await job.adapter.fetch(job.keyword, job.relatedTerms, {
        now,
        fetcher: options.fetcher
      })
    }))
  );
  const liveItems = results.flatMap(({ result, keyword, relatedTerms }) =>
    result.items.map((item) => rawToRadarItem(item, keyword, relatedTerms, result.fetchedAt))
  );
  const nextItems = preserveSaved(dedupe([...liveItems, ...fallbackItems(now)]), state.items);
  const sourceStatuses = { ...state.sourceStatuses };
  const resultsBySource = new Map<SourceType, SourceFetchResult[]>();

  for (const { result } of results) {
    resultsBySource.set(result.sourceType, [...(resultsBySource.get(result.sourceType) ?? []), result]);
  }
  for (const [sourceType, sourceResults] of resultsBySource) {
    sourceStatuses[sourceType] = statusFromResults(sourceType, sourceResults);
  }
  sourceStatuses.wechat = {
    sourceType: 'wechat',
    label: sourceLabels.wechat,
    status: 'cached',
    message: 'Using cached demo data because WeChat crawling is unstable',
    lastFetchedAt: now
  };
  sourceStatuses.huggingface = {
    sourceType: 'huggingface',
    label: sourceLabels.huggingface,
    status: 'cached',
    message: 'Using cached Hugging Face demo data until the live adapter is enabled',
    lastFetchedAt: now
  };

  return {
    ...state,
    items: nextItems,
    sourceStatuses,
    lastUpdatedAt: now,
    isRefreshing: false
  };
}
