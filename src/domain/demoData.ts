import type { KeywordConfig, RadarItem, SourceStatus, SourceType } from './types';

export const sourceLabels: Record<SourceType, string> = {
  news: 'Technology News',
  paper: 'Academic Papers',
  github: 'GitHub',
  huggingface: 'Hugging Face',
  wechat: 'Machine Heart / WeChat'
};

export const defaultKeywords: KeywordConfig[] = [
  {
    id: 'keyword-llm-agent',
    term: 'LLM Agent',
    enabled: true,
    sources: ['paper', 'github', 'huggingface', 'news', 'wechat'],
    relatedTerms: ['multi-agent', 'tool use', 'workflow automation']
  },
  {
    id: 'keyword-rag',
    term: 'RAG',
    enabled: true,
    sources: ['paper', 'github', 'news'],
    relatedTerms: ['retrieval', 'vector database', 'grounded generation']
  },
  {
    id: 'keyword-diffusion',
    term: 'Diffusion',
    enabled: true,
    sources: ['paper', 'github', 'huggingface', 'news'],
    relatedTerms: ['image generation', 'latent diffusion', 'video model']
  }
];

export function createDefaultSourceStatuses(now: string): Record<SourceType, SourceStatus> {
  return {
    news: {
      sourceType: 'news',
      label: sourceLabels.news,
      status: 'fetched',
      message: 'RSS/news sample ready',
      lastFetchedAt: now
    },
    paper: {
      sourceType: 'paper',
      label: sourceLabels.paper,
      status: 'fetched',
      message: 'arXiv sample ready',
      lastFetchedAt: now
    },
    github: {
      sourceType: 'github',
      label: sourceLabels.github,
      status: 'fetched',
      message: 'GitHub sample ready',
      lastFetchedAt: now
    },
    huggingface: {
      sourceType: 'huggingface',
      label: sourceLabels.huggingface,
      status: 'fetched',
      message: 'Hugging Face sample ready',
      lastFetchedAt: now
    },
    wechat: {
      sourceType: 'wechat',
      label: sourceLabels.wechat,
      status: 'cached',
      message: 'Using clearly labeled cached demo data',
      lastFetchedAt: now
    }
  };
}

export function createDemoItems(now: string): RadarItem[] {
  const base = {
    fetchedAt: now,
    sourceStatus: 'fetched' as const,
    sourceUpdatedAt: now,
    analysisStatus: 'done' as const,
    scoreVersion: 'radar-v1',
    isCachedSample: false,
    createdAt: now,
    updatedAt: now,
    saved: false
  };

  return [
    {
      ...base,
      id: 'paper-agent-benchmark',
      externalId: 'arxiv:2607.00001',
      title: 'AgentBench++ evaluates tool-using LLM agents',
      sourceType: 'paper',
      sourceName: 'arXiv',
      url: 'https://arxiv.org/abs/2607.00001',
      publishedAt: '2026-07-13T02:30:00.000Z',
      matchedKeyword: 'LLM Agent',
      rawSnippet:
        'A benchmark for evaluating planning, tool use, and memory in autonomous LLM agents.',
      summary:
        'Introduces a benchmark for multi-step LLM agents with tool use and workflow tasks.',
      tags: ['LLM Agent', 'benchmark', 'tool use'],
      relevanceScore: 96,
      reason:
        'Directly matches LLM Agent and provides an evaluation angle for research projects.'
    },
    {
      ...base,
      id: 'github-agent-runtime',
      externalId: 'github:open-agent/runtime',
      title: 'open-agent/runtime',
      sourceType: 'github',
      sourceName: 'GitHub',
      url: 'https://github.com/open-agent/runtime',
      publishedAt: '2026-07-12T18:00:00.000Z',
      matchedKeyword: 'LLM Agent',
      rawSnippet:
        'TypeScript runtime for composing tool calls, memory, and workflow automation.',
      summary:
        'A developer-oriented runtime for building agent workflows with tool integrations.',
      tags: ['agent runtime', 'TypeScript', 'workflow'],
      relevanceScore: 93,
      reason:
        'Useful implementation reference for agent workflow automation and tool orchestration.'
    },
    {
      ...base,
      id: 'paper-rag-memory',
      externalId: 'arxiv:2607.00002',
      title: 'Memory-aware retrieval improves grounded generation',
      sourceType: 'paper',
      sourceName: 'arXiv',
      url: 'https://arxiv.org/abs/2607.00002',
      publishedAt: '2026-07-12T12:10:00.000Z',
      matchedKeyword: 'RAG',
      rawSnippet:
        'A retrieval-augmented generation method that adds memory ranking before generation.',
      summary:
        'Shows how memory ranking can improve retrieval quality before grounded generation.',
      tags: ['RAG', 'memory', 'retrieval'],
      relevanceScore: 90,
      reason:
        'Strongly matches RAG and gives a concrete method that can inspire implementation.'
    },
    {
      ...base,
      id: 'hf-diffusion-video',
      externalId: 'hf:model/video-diffusion-lab',
      title: 'Video Diffusion Lab releases compact motion model',
      sourceType: 'huggingface',
      sourceName: 'Hugging Face',
      url: 'https://huggingface.co/video-diffusion-lab/compact-motion',
      publishedAt: '2026-07-11T09:20:00.000Z',
      matchedKeyword: 'Diffusion',
      rawSnippet:
        'A compact diffusion model for short video generation with lower GPU memory usage.',
      summary:
        'A smaller video diffusion model focused on practical experimentation and demos.',
      tags: ['diffusion', 'video model', 'Hugging Face'],
      relevanceScore: 87,
      reason:
        'Matches Diffusion and is actionable because model artifacts are available.'
    },
    {
      ...base,
      id: 'news-agent-funding',
      externalId: 'news:agent-stack-roundup',
      title: 'Developers converge on agent stacks for research automation',
      sourceType: 'news',
      sourceName: 'MIT Technology Review',
      url: 'https://www.technologyreview.com/',
      publishedAt: '2026-07-10T16:45:00.000Z',
      matchedKeyword: 'LLM Agent',
      rawSnippet:
        'Research teams are combining LLM agents, retrieval, and workflow tools for productivity.',
      summary:
        'Reports a broader trend toward agent-based research and developer productivity tools.',
      tags: ['LLM Agent', 'research tools', 'trend'],
      relevanceScore: 84,
      reason:
        'Good context for explaining why a personal research radar is useful now.'
    },
    {
      ...base,
      id: 'wechat-rag-industry',
      externalId: 'cached:machine-heart-rag',
      title: 'Machine Heart: RAG applications move deeper into production',
      sourceType: 'wechat',
      sourceName: 'Machine Heart cached sample',
      url: 'https://www.jiqizhixin.com/',
      publishedAt: '2026-07-09T08:00:00.000Z',
      matchedKeyword: 'RAG',
      rawSnippet:
        'Cached Chinese AI media sample discussing RAG system reliability and deployment.',
      summary:
        'Chinese AI media coverage of RAG reliability, evaluation, and deployment practice.',
      tags: ['RAG', 'production', 'cached sample'],
      relevanceScore: 79,
      reason:
        'Useful Chinese-language context, but marked as cached because direct crawling is unstable.',
      sourceStatus: 'cached',
      isCachedSample: true
    },
    {
      ...base,
      id: 'github-vector-store',
      externalId: 'github:retrieval/vector-lab',
      title: 'retrieval/vector-lab',
      sourceType: 'github',
      sourceName: 'GitHub',
      url: 'https://github.com/retrieval/vector-lab',
      publishedAt: '2026-07-08T17:15:00.000Z',
      matchedKeyword: 'RAG',
      rawSnippet:
        'Experiments comparing vector search and hybrid retrieval for grounded generation.',
      summary:
        'A practical repository for comparing retrieval strategies used in RAG systems.',
      tags: ['RAG', 'vector database', 'hybrid search'],
      relevanceScore: 76,
      reason:
        'Helpful implementation reference, though less directly novel than the top papers.'
    }
  ];
}
