import { createDefaultSourceStatuses, createDemoItems, defaultKeywords } from './demoData';
import type {
  AppState,
  FeedFilter,
  RadarItem,
  SourceType,
  TodaySummary
} from './types';

const sourceTypes: SourceType[] = ['news', 'paper', 'github', 'huggingface', 'wechat'];

export function createInitialState(now = new Date().toISOString()): AppState {
  return {
    keywords: structuredClone(defaultKeywords),
    items: createDemoItems(now),
    sourceStatuses: createDefaultSourceStatuses(now),
    lastUpdatedAt: now,
    isRefreshing: false
  };
}

export function getVisibleFeedItems(
  items: RadarItem[],
  filter: FeedFilter
): RadarItem[] {
  const normalizedQuery = filter.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesSource =
      filter.sourceType === 'all' || item.sourceType === filter.sourceType;
    const searchable = [
      item.title,
      item.summary,
      item.rawSnippet,
      item.matchedKeyword,
      item.sourceName,
      ...item.tags
    ]
      .join(' ')
      .toLowerCase();
    const matchesQuery = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);

    return matchesSource && matchesQuery && item.relevanceScore >= 50;
  });

  return filtered.toSorted((left, right) => {
    if (filter.sortBy === 'publishedAt') {
      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    }

    if (filter.sortBy === 'sourceType') {
      return left.sourceType.localeCompare(right.sourceType);
    }

    return right.relevanceScore - left.relevanceScore;
  });
}

export function getTodaySummary(state: AppState): TodaySummary {
  const counts = sourceTypes.reduce(
    (result, sourceType) => {
      result[sourceType] = state.items.filter((item) => item.sourceType === sourceType).length;
      return result;
    },
    {} as Record<SourceType, number>
  );

  const topMatches = state.items
    .filter((item) => item.relevanceScore >= 80 && item.analysisStatus === 'done')
    .toSorted((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, 5);

  return {
    totalItems: state.items.length,
    counts,
    topMatches,
    activeKeywordCount: state.keywords.filter((keyword) => keyword.enabled).length
  };
}

export function toggleSaved(items: RadarItem[], itemId: string): RadarItem[] {
  return items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          saved: !item.saved,
          updatedAt: new Date().toISOString()
        }
      : item
  );
}
