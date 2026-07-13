import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('Research Radar app', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Today as the default mobile dashboard', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Research Radar' })).toBeInTheDocument();
    expect(screen.getByText('Top Matches')).toBeInTheDocument();
    expect(screen.getAllByText('LLM Agent').length).toBeGreaterThan(0);
  });

  it('shows source status labels and update time on Today', () => {
    render(<App />);

    const sourceStatus = screen.getByLabelText('Source status');

    expect(within(sourceStatus).getAllByText('fetched').length).toBeGreaterThan(0);
    expect(within(sourceStatus).getByText('cached')).toBeInTheDocument();
    expect(within(sourceStatus).getAllByText(/Updated/).length).toBeGreaterThan(0);
  });

  it('switches to Feed and filters by Papers', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Feed' }));
    await user.click(screen.getByRole('button', { name: 'Papers' }));

    expect(screen.getByRole('heading', { name: 'Unified Feed' })).toBeInTheDocument();
    expect(screen.getByText('AgentBench++ evaluates tool-using LLM agents')).toBeInTheDocument();
    expect(screen.queryByText('open-agent/runtime')).not.toBeInTheDocument();
  });

  it('uses compact Feed source filter labels for mobile discoverability', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Feed' }));

    expect(screen.getByRole('button', { name: 'Papers' })).toHaveTextContent('Paper');
    expect(screen.getByRole('button', { name: 'Hugging Face' })).toHaveTextContent('HF');
    expect(screen.getByRole('button', { name: 'WeChat' })).toBeInTheDocument();
  });

  it('saves an item and shows it in Saved', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Save AgentBench++ evaluates tool-using LLM agents'
      })
    );
    await user.click(screen.getByRole('button', { name: 'Saved' }));

    expect(screen.getByRole('heading', { name: 'Saved Reading List' })).toBeInTheDocument();
    expect(screen.getByText('AgentBench++ evaluates tool-using LLM agents')).toBeInTheDocument();
  });

  it('adds a keyword with suggested related terms', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Keywords' }));
    await user.type(screen.getByLabelText('New keyword'), 'multi-agent');
    await user.click(screen.getByRole('button', { name: 'Add keyword' }));

    expect(screen.getByText('multi-agent')).toBeInTheDocument();
    expect(screen.getByText(/agent workflow/)).toBeInTheDocument();
  });

  it('shows source health and API key guidance in Settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const statusList = screen.getByLabelText('Source health');

    expect(within(statusList).getByText('GitHub')).toBeInTheDocument();
    expect(within(statusList).getByText('Machine Heart / WeChat')).toBeInTheDocument();
    expect(screen.getByText('OPENAI_API_KEY')).toBeInTheDocument();
    expect(screen.getByText('Missing API key')).toBeInTheDocument();
    expect(screen.queryByText(/sk-test/)).not.toBeInTheDocument();
  });

  it('checks a configured LLM gateway from Settings', async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [] })));
    render(
      <App
        llmEnv={{
          VITE_OPENAI_API_KEY: 'sk-test-secret',
          VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
        }}
        gatewayFetcher={fetcher}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Check Gateway' }));

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.queryByText(/sk-test-secret/)).not.toBeInTheDocument();
  });

  it('shows a non-fatal failed gateway check state', async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn(async () => new Response('bad gateway', { status: 502 }));
    render(
      <App
        llmEnv={{
          VITE_OPENAI_API_KEY: 'sk-test-secret',
          VITE_OPENAI_BASE_URL: 'https://gmncode.cn/v1'
        }}
        gatewayFetcher={fetcher}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Check Gateway' }));

    expect(await screen.findByText('Last check failed')).toBeInTheDocument();
    expect(screen.getByText(/Fetched source results remain visible/)).toBeInTheDocument();
  });

  it('refreshes through the live source coordinator and updates source health', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'fetch').mockImplementation(async (url) => {
      const href = String(url);
      if (href.includes('arxiv')) {
        return new Response(
          '<feed><entry><id>arxiv-live</id><title>Live Agent Paper</title><summary>LLM Agent tool use.</summary><published>2026-07-13T00:00:00Z</published><author><name>Grace Hopper</name></author></entry></feed>'
        );
      }
      if (href.includes('github')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 99,
                full_name: 'live/agent-runtime',
                html_url: 'https://github.com/live/agent-runtime',
                description: 'LLM Agent runtime',
                updated_at: '2026-07-13T00:00:00Z',
                stargazers_count: 88,
                language: 'TypeScript',
                owner: { login: 'live' }
              }
            ]
          })
        );
      }
      return new Response(
        JSON.stringify({
          hits: [
            {
              objectID: 'live-news',
              title: 'Live agent research update',
              url: 'https://example.com/live-agent',
              story_text: 'LLM Agent research update',
              created_at: '2026-07-13T00:00:00Z',
              author: 'newsbot'
            }
          ]
        })
      );
    });
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByText('GitHub returned 3 items')).toBeInTheDocument();
    expect(screen.getByText('arXiv returned 3 items')).toBeInTheDocument();
    expect(screen.getByText('Hacker News returned 3 items')).toBeInTheDocument();
  });
});
