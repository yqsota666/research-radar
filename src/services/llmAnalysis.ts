import type { AnalysisResult } from './analysis';
import { analyzeRawItem } from './analysis';
import { getLlmConfigStatus, type LlmEnv } from './llmConfig';
import type { RawSourceItem } from './sourceAdapters';

export interface LlmAnalysisOptions {
  env?: LlmEnv;
  fetcher?: typeof fetch;
  now?: string;
  timeoutMs?: number;
}

export interface LlmAnalysisResult {
  analysis: AnalysisResult;
  analysisStatus: 'done' | 'failed';
  source: 'llm' | 'heuristic';
  checkedAt: string;
  errorMessage?: string;
}

const defaultModel = 'gpt-5.6-luna';
const defaultTimeoutMs = 10000;

function clampScore(value: unknown): number {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return 70;
  return Math.max(45, Math.min(98, Math.round(score)));
}

function cleanText(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text || fallback;
}

function cleanTags(value: unknown, keyword: string, sourceName: string): string[] {
  const incoming = Array.isArray(value) ? value : [];
  const tags = incoming
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const unique = Array.from(new Set([keyword, ...tags]));
  return (unique.length >= 3 ? unique : [...unique, sourceName]).slice(0, 5);
}

function parseLlmAnalysis(raw: unknown, item: RawSourceItem, keyword: string): AnalysisResult {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    summary: cleanText(value.summary, `${item.title}: ${item.rawSnippet}`.slice(0, 180)),
    tags: cleanTags(value.tags, keyword, item.sourceName),
    relevanceScore: clampScore(value.relevanceScore),
    reason: cleanText(value.reason, `Matched ${keyword} from ${item.sourceName}.`)
  };
}

function heuristicResult(
  item: RawSourceItem,
  keyword: string,
  relatedTerms: string[],
  checkedAt: string,
  errorMessage?: string
): LlmAnalysisResult {
  return {
    analysis: analyzeRawItem(item, keyword, relatedTerms),
    analysisStatus: errorMessage ? 'failed' : 'done',
    source: 'heuristic',
    checkedAt,
    errorMessage
  };
}

async function fetchJsonWithTimeout(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`LLM request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function analyzeWithLlm(
  item: RawSourceItem,
  keyword: string,
  relatedTerms: string[] = [],
  options: LlmAnalysisOptions = {}
): Promise<LlmAnalysisResult> {
  const checkedAt = options.now ?? new Date().toISOString();
  const env = options.env ?? import.meta.env;
  const config = getLlmConfigStatus(env);

  if (config.status !== 'configured') {
    return heuristicResult(item, keyword, relatedTerms, checkedAt);
  }

  const apiKey = env.VITE_OPENAI_API_KEY?.trim() ?? '';
  const model = env.VITE_OPENAI_MODEL?.trim() || defaultModel;
  const url = `${config.safeBaseUrl.replace(/\/$/, '')}/chat/completions`;
  const fetcher = options.fetcher ?? fetch;
  const body = {
    model,
    reasoning_effort: 'low',
    temperature: 0.1,
    max_tokens: 220,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You analyze AI research radar items. Return only compact JSON with summary, tags, relevanceScore, and reason. Use clear English.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          keyword,
          relatedTerms,
          sourceName: item.sourceName,
          sourceType: item.sourceType,
          title: item.title,
          snippet: item.rawSnippet,
          metadata: item.metadata
        })
      }
    ]
  };

  try {
    const json = (await fetchJsonWithTimeout(
      fetcher,
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      options.timeoutMs ?? defaultTimeoutMs
    )) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as unknown;
    return {
      analysis: parseLlmAnalysis(parsed, item, keyword),
      analysisStatus: 'done',
      source: 'llm',
      checkedAt
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return heuristicResult(item, keyword, relatedTerms, checkedAt, `LLM analysis failed: ${message}`);
  }
}
