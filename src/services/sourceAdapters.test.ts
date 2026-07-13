import { describe, expect, it } from 'vitest';
import { arxivAdapter, githubAdapter, newsAdapter } from './sourceAdapters';

function response(body: string, ok = true): Response {
  return new Response(body, { status: ok ? 200 : 500 });
}

describe('source adapters', () => {
  it('normalizes arXiv XML search results', async () => {
    const fetcher = async () =>
      response(`
        <feed>
          <entry>
            <id>http://arxiv.org/abs/2607.00001v1</id>
            <title> Agent planning with tools </title>
            <summary> A paper about LLM agent planning and tool use. </summary>
            <published>2026-07-13T00:00:00Z</published>
            <author><name>Ada Lovelace</name></author>
          </entry>
        </feed>
      `);

    const result = await arxivAdapter.fetch('LLM Agent', ['tool use'], { fetcher });

    expect(result.status).toBe('success');
    expect(result.items[0]).toMatchObject({
      externalId: 'http://arxiv.org/abs/2607.00001v1',
      title: 'Agent planning with tools',
      sourceType: 'paper',
      sourceName: 'arXiv',
      authorsOrOwner: 'Ada Lovelace'
    });
  });

  it('normalizes GitHub repository search results', async () => {
    const fetcher = async () =>
      response(
        JSON.stringify({
          items: [
            {
              id: 42,
              full_name: 'open-agent/runtime',
              html_url: 'https://github.com/open-agent/runtime',
              description: 'Runtime for LLM agent workflows',
              updated_at: '2026-07-12T00:00:00Z',
              stargazers_count: 1200,
              language: 'TypeScript',
              owner: { login: 'open-agent' }
            }
          ]
        })
      );

    const result = await githubAdapter.fetch('LLM Agent', [], { fetcher });

    expect(result.status).toBe('success');
    expect(result.items[0]).toMatchObject({
      externalId: 'github:42',
      title: 'open-agent/runtime',
      sourceType: 'github',
      sourceName: 'GitHub',
      authorsOrOwner: 'open-agent'
    });
    expect(result.items[0].metadata.stars).toBe(1200);
  });

  it('normalizes Hacker News Algolia search results as technology news', async () => {
    const fetcher = async () =>
      response(
        JSON.stringify({
          hits: [
            {
              objectID: 'hn-1',
              title: 'Agent tools are reshaping research workflows',
              url: 'https://example.com/agent-tools',
              story_text: null,
              created_at: '2026-07-11T00:00:00Z',
              author: 'researcher'
            }
          ]
        })
      );

    const result = await newsAdapter.fetch('LLM Agent', [], { fetcher });

    expect(result.status).toBe('success');
    expect(result.items[0]).toMatchObject({
      externalId: 'hn:hn-1',
      title: 'Agent tools are reshaping research workflows',
      sourceType: 'news',
      sourceName: 'Hacker News',
      authorsOrOwner: 'researcher'
    });
  });

  it('returns a failed result when a source request fails', async () => {
    const fetcher = async () => response('nope', false);

    const result = await githubAdapter.fetch('LLM Agent', [], { fetcher });

    expect(result.status).toBe('failed');
    expect(result.items).toEqual([]);
    expect(result.errorMessage).toContain('GitHub');
  });
});
