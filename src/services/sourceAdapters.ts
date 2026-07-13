import type { SourceType } from '../domain/types';

export interface RawSourceItem {
  externalId: string;
  title: string;
  url: string;
  publishedAt: string;
  authorsOrOwner: string;
  rawSnippet: string;
  sourceType: SourceType;
  sourceName: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface SourceFetchResult {
  sourceType: SourceType;
  sourceName: string;
  items: RawSourceItem[];
  fetchedAt: string;
  status: 'success' | 'partial' | 'failed' | 'cached';
  errorMessage?: string;
  nextRetryAt?: string;
}

export interface SourceFetchOptions {
  fetcher?: typeof fetch;
  now?: string;
}

export interface SourceAdapter {
  sourceType: SourceType;
  sourceName: string;
  fetch(
    keyword: string,
    relatedTerms: string[],
    options?: SourceFetchOptions
  ): Promise<SourceFetchResult>;
}

function textOf(parent: Element, selector: string): string {
  return parent.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function buildQuery(keyword: string, relatedTerms: string[]): string {
  return [keyword, ...relatedTerms].filter(Boolean).join(' OR ');
}

function failure(
  sourceType: SourceType,
  sourceName: string,
  fetchedAt: string,
  error: unknown
): SourceFetchResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    sourceType,
    sourceName,
    items: [],
    fetchedAt,
    status: 'failed',
    errorMessage: `${sourceName} fetch failed: ${message}`
  };
}

function arxivCachedFallback(
  keyword: string,
  relatedTerms: string[],
  fetchedAt: string,
  error: unknown
): SourceFetchResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    sourceType: 'paper',
    sourceName: 'arXiv',
    items: [
      {
        externalId: `cached-arxiv-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: `Cached paper sample for ${keyword}`,
        url: 'https://arxiv.org/',
        publishedAt: fetchedAt,
        authorsOrOwner: 'cached demo',
        rawSnippet: `Cached fallback paper for ${keyword}. Related terms: ${relatedTerms.join(', ') || keyword}.`,
        sourceType: 'paper',
        sourceName: 'arXiv cached fallback',
        metadata: { keyword, cached: true }
      }
    ],
    fetchedAt,
    status: 'cached',
    errorMessage: `arXiv unavailable; using browser-safe cached fallback. ${message}`
  };
}

async function ensureOk(response: Response, sourceName: string): Promise<Response> {
  if (!response.ok) {
    throw new Error(`${sourceName} returned HTTP ${response.status}`);
  }
  return response;
}

export const arxivAdapter: SourceAdapter = {
  sourceType: 'paper',
  sourceName: 'arXiv',
  async fetch(keyword, relatedTerms, options = {}) {
    const fetcher = options.fetcher ?? fetch;
    const fetchedAt = options.now ?? new Date().toISOString();
    try {
      const query = encodeURIComponent(buildQuery(keyword, relatedTerms));
      const result = await ensureOk(
        await fetcher(
          `https://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`
        ),
        'arXiv'
      );
      const xml = await result.text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const items = [...doc.querySelectorAll('entry')].map((entry): RawSourceItem => {
        const externalId = textOf(entry, 'id');
        const title = textOf(entry, 'title');
        const publishedAt = textOf(entry, 'published') || fetchedAt;
        const authors = [...entry.querySelectorAll('author name')]
          .map((node) => node.textContent?.trim())
          .filter(Boolean)
          .join(', ');
        return {
          externalId,
          title,
          url: externalId,
          publishedAt,
          authorsOrOwner: authors,
          rawSnippet: textOf(entry, 'summary'),
          sourceType: 'paper',
          sourceName: 'arXiv',
          metadata: { keyword }
        };
      });
      return { sourceType: 'paper', sourceName: 'arXiv', items, fetchedAt, status: 'success' };
    } catch (error) {
      return arxivCachedFallback(keyword, relatedTerms, fetchedAt, error);
    }
  }
};

export const githubAdapter: SourceAdapter = {
  sourceType: 'github',
  sourceName: 'GitHub',
  async fetch(keyword, relatedTerms, options = {}) {
    const fetcher = options.fetcher ?? fetch;
    const fetchedAt = options.now ?? new Date().toISOString();
    try {
      const query = encodeURIComponent(`${buildQuery(keyword, relatedTerms)} sort:updated-desc`);
      const result = await ensureOk(
        await fetcher(`https://api.github.com/search/repositories?q=${query}&per_page=8`),
        'GitHub'
      );
      const json = (await result.json()) as {
        items?: Array<{
          id: number;
          full_name: string;
          html_url: string;
          description: string | null;
          updated_at: string;
          stargazers_count: number;
          language: string | null;
          owner?: { login?: string };
        }>;
      };
      const items = (json.items ?? []).map((repo): RawSourceItem => ({
        externalId: `github:${repo.id}`,
        title: repo.full_name,
        url: repo.html_url,
        publishedAt: repo.updated_at,
        authorsOrOwner: repo.owner?.login ?? repo.full_name.split('/')[0],
        rawSnippet: repo.description ?? 'No repository description available.',
        sourceType: 'github',
        sourceName: 'GitHub',
        metadata: {
          stars: repo.stargazers_count,
          language: repo.language,
          keyword
        }
      }));
      return { sourceType: 'github', sourceName: 'GitHub', items, fetchedAt, status: 'success' };
    } catch (error) {
      return failure('github', 'GitHub', fetchedAt, error);
    }
  }
};

export const newsAdapter: SourceAdapter = {
  sourceType: 'news',
  sourceName: 'Hacker News',
  async fetch(keyword, relatedTerms, options = {}) {
    const fetcher = options.fetcher ?? fetch;
    const fetchedAt = options.now ?? new Date().toISOString();
    try {
      const query = encodeURIComponent(buildQuery(keyword, relatedTerms));
      const result = await ensureOk(
        await fetcher(`https://hn.algolia.com/api/v1/search?query=${query}&tags=story`),
        'Hacker News'
      );
      const json = (await result.json()) as {
        hits?: Array<{
          objectID: string;
          title?: string | null;
          story_title?: string | null;
          url?: string | null;
          story_url?: string | null;
          story_text?: string | null;
          created_at: string;
          author: string;
        }>;
      };
      const items = (json.hits ?? [])
        .filter((hit) => hit.title || hit.story_title)
        .map((hit): RawSourceItem => ({
          externalId: `hn:${hit.objectID}`,
          title: hit.title ?? hit.story_title ?? 'Untitled HN story',
          url: hit.url ?? hit.story_url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
          publishedAt: hit.created_at,
          authorsOrOwner: hit.author,
          rawSnippet: hit.story_text ?? 'Hacker News story matched this radar keyword.',
          sourceType: 'news',
          sourceName: 'Hacker News',
          metadata: { keyword }
        }));
      return { sourceType: 'news', sourceName: 'Hacker News', items, fetchedAt, status: 'success' };
    } catch (error) {
      return failure('news', 'Hacker News', fetchedAt, error);
    }
  }
};

export const stableSourceAdapters: SourceAdapter[] = [
  arxivAdapter,
  githubAdapter,
  newsAdapter
];
