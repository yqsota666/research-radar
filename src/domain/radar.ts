import { createDefaultSourceStatuses, createDemoItems, defaultKeywords } from './demoData';
import type {
  AppState,
  FeedFilter,
  RadarItem,
  SourceType,
  TodaySummary
} from './types';

const sourceTypes: SourceType[] = ['news', 'paper', 'github', 'huggingface', 'wechat'];
const topMatchLimit = 5;
const diversityScoreWindow = 10;

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

  const eligibleTopMatches = state.items
    .filter((item) => item.relevanceScore >= 80 && item.analysisStatus === 'done')
    .toSorted((left, right) => right.relevanceScore - left.relevanceScore);
  const topMatches = selectDiverseTopMatches(eligibleTopMatches);

  return {
    totalItems: state.items.length,
    counts,
    topMatches,
    activeKeywordCount: state.keywords.filter((keyword) => keyword.enabled).length
  };
}

function selectDiverseTopMatches(sortedItems: RadarItem[]): RadarItem[] {
  if (sortedItems.length === 0) {
    return sortedItems;
  }

  const selected: RadarItem[] = [sortedItems[0]];
  const selectedIds = new Set([sortedItems[0].id]);
  const representedKeywords = new Set([sortedItems[0].matchedKeyword]);
  const highestScore = sortedItems[0].relevanceScore;

  for (const item of sortedItems) {
    if (selected.length >= topMatchLimit) break;
    if (selectedIds.has(item.id)) continue;
    if (representedKeywords.has(item.matchedKeyword)) continue;
    if (item.relevanceScore < highestScore - diversityScoreWindow) continue;
    selected.push(item);
    selectedIds.add(item.id);
    representedKeywords.add(item.matchedKeyword);
  }

  for (const item of sortedItems) {
    if (selected.length >= topMatchLimit) break;
    if (selectedIds.has(item.id)) continue;
    selected.push(item);
    selectedIds.add(item.id);
  }

  return selected;
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
