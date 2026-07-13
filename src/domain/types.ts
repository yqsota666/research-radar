export type SourceType = 'news' | 'paper' | 'github' | 'huggingface' | 'wechat';

export type SourceFetchStatus = 'pending' | 'fetched' | 'failed' | 'cached';

export type AnalysisStatus = 'pending' | 'analyzing' | 'done' | 'failed';

export interface RadarItem {
  id: string;
  externalId: string;
  title: string;
  sourceType: SourceType;
  sourceName: string;
  url: string;
  publishedAt: string;
  matchedKeyword: string;
  rawSnippet: string;
  summary: string;
  tags: string[];
  relevanceScore: number;
  reason: string;
  saved: boolean;
  fetchedAt: string;
  sourceStatus: SourceFetchStatus;
  sourceUpdatedAt: string;
  analysisStatus: AnalysisStatus;
  analysisError?: string;
  scoreVersion: string;
  isCachedSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordConfig {
  id: string;
  term: string;
  enabled: boolean;
  sources: SourceType[];
  relatedTerms: string[];
}

export interface SourceStatus {
  sourceType: SourceType;
  label: string;
  status: SourceFetchStatus;
  message: string;
  lastFetchedAt?: string;
  nextRetryAt?: string;
}

export interface AppState {
  keywords: KeywordConfig[];
  items: RadarItem[];
  sourceStatuses: Record<SourceType, SourceStatus>;
  lastUpdatedAt: string;
  isRefreshing: boolean;
}

export interface FeedFilter {
  sourceType: SourceType | 'all';
  query: string;
  sortBy: 'relevance' | 'publishedAt' | 'sourceType';
}

export interface TodaySummary {
  totalItems: number;
  counts: Record<SourceType, number>;
  topMatches: RadarItem[];
  activeKeywordCount: number;
}
