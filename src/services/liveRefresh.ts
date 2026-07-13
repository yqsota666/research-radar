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

function statusFromResult(result: SourceFetchResult): SourceStatus {
  const status = result.status === 'success' || result.status === 'partial' ? 'fetched' : result.status;
  return {
    sourceType: result.sourceType,
    label: sourceLabels[result.sourceType],
    status,
    message:
      result.status === 'failed'
        ? result.errorMessage ?? `${result.sourceName} failed`
        : `${result.sourceName} returned ${result.items.length} item${result.items.length === 1 ? '' : 's'}`,
    lastFetchedAt: result.fetchedAt,
    nextRetryAt: result.nextRetryAt
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
  const activeKeyword = state.keywords.find((keyword) => keyword.enabled) ?? state.keywords[0];
  const relatedTerms = activeKeyword?.relatedTerms ?? [];
  const keyword = activeKeyword?.term ?? 'LLM Agent';

  const results = await Promise.all(
    adapters.map((adapter) => adapter.fetch(keyword, relatedTerms, { now, fetcher: options.fetcher }))
  );
  const liveItems = results.flatMap((result) =>
    result.items.map((item) => rawToRadarItem(item, keyword, relatedTerms, result.fetchedAt))
  );
  const nextItems = preserveSaved(dedupe([...liveItems, ...fallbackItems(now)]), state.items);
  const sourceStatuses = { ...state.sourceStatuses };

  for (const result of results) {
    sourceStatuses[result.sourceType] = statusFromResult(result);
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
