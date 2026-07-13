import type { SourceType } from '../domain/types';
import type { RawSourceItem } from './sourceAdapters';

export interface AnalysisResult {
  summary: string;
  tags: string[];
  relevanceScore: number;
  reason: string;
}

const sourceTags: Record<SourceType, string> = {
  news: 'trend',
  paper: 'paper',
  github: 'repository',
  huggingface: 'model',
  wechat: 'Chinese AI media'
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
}

function keywordParts(keyword: string, relatedTerms: string[]): string[] {
  return [keyword, ...relatedTerms]
    .flatMap((term) => normalize(term).split(' '))
    .filter((part) => part.length > 2);
}

function clampScore(score: number): number {
  return Math.max(45, Math.min(98, score));
}

export function analyzeRawItem(
  item: RawSourceItem,
  keyword: string,
  relatedTerms: string[] = []
): AnalysisResult {
  const haystack = normalize(`${item.title} ${item.rawSnippet}`);
  const parts = keywordParts(keyword, relatedTerms);
  const matched = parts.filter((part) => haystack.includes(part));
  const directKeyword = haystack.includes(normalize(keyword));
  const sourceBoost = item.sourceType === 'paper' || item.sourceType === 'github' ? 8 : 4;
  const score = clampScore(55 + matched.length * 8 + (directKeyword ? 18 : 0) + sourceBoost);
  const tags = Array.from(
    new Set([
      keyword,
      ...relatedTerms.slice(0, 2),
      sourceTags[item.sourceType],
      ...(typeof item.metadata.language === 'string' ? [item.metadata.language] : [])
    ])
  ).slice(0, 5);

  return {
    summary: `${item.title}: ${item.rawSnippet}`.slice(0, 180),
    tags: tags.length >= 3 ? tags : [...tags, item.sourceName].slice(0, 5),
    relevanceScore: score,
    reason:
      matched.length > 0
        ? `Matches ${keyword} through ${matched.slice(0, 3).join(', ')} and comes from ${item.sourceName}.`
        : `Weak but potentially useful ${keyword} signal from ${item.sourceName}; review before relying on it.`
  };
}
