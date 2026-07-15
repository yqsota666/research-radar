import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('Research Radar mobile app', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('opens on a concise Today view with five top matches and no visible score', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Research Radar/i })).toBeInTheDocument();
    expect(screen.getByText("Today's signal")).toBeInTheDocument();

    const topMatches = screen.getByLabelText('Top matches');
    expect(within(topMatches).getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByText(/relevance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it('keeps the main navigation to Today, Library, and Settings', () => {
    const { container } = render(<App />);

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(container.querySelector('main > div')).toBeInTheDocument();
    expect(nav.className).toMatch(/\bfixed\b/);
    expect(nav.className).toMatch(/\bbottom-8\b/);
    expect(nav.className).not.toMatch(/\b(?:absolute|sticky|bottom-0)\b/);
    expect(within(nav).getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Library' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: 'Feed' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: 'Saved' })).not.toBeInTheDocument();
  });

  it('supports Library search, source filtering, and sorting controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Library' }));
    await user.type(screen.getByLabelText('Search library'), 'agent');

    expect(screen.getByText('AgentBench++ evaluates tool-using LLM agents')).toBeInTheDocument();
    expect(screen.queryByText('Video Diffusion Lab releases compact motion model')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter source'), 'paper');
    expect(screen.getByText('AgentBench++ evaluates tool-using LLM agents')).toBeInTheDocument();
    expect(screen.queryByText('open-agent/runtime')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Sort library'), 'sourceType');
    expect(screen.getByLabelText('Sort library')).toHaveValue('sourceType');
  });

  it('opens details and saves from the detail view only', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('button', { name: /Save AgentBench/i })).not.toBeInTheDocument();

    await user.click(screen.getByText('AgentBench++ evaluates tool-using LLM agents'));
    await user.click(screen.getByRole('button', { name: 'Save item' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'Library' }));
    await user.click(screen.getByRole('button', { name: 'Saved' }));

    expect(screen.getByRole('heading', { name: 'Saved' })).toBeInTheDocument();
    expect(screen.getByText('AgentBench++ evaluates tool-using LLM agents')).toBeInTheDocument();
  });

  it('shows keyword setup, sources, and AI analysis status in Settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('AI analysis')).toBeInTheDocument();
    expect(screen.getByText('Missing API key')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keywords' }));
    await user.type(screen.getByLabelText('New keyword'), 'multi-agent');
    await user.click(screen.getByRole('button', { name: 'Add keyword' }));
    expect(screen.getByText('multi-agent')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to settings' }));
    await user.click(screen.getByRole('button', { name: 'Sources' }));
    expect(screen.getByText('Machine Heart / WeChat')).toBeInTheDocument();
    expect(screen.getAllByText(/cached/i).length).toBeGreaterThan(0);
  });

  it('toggles Settings switches with accessible names and keeps them after navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Turn auto refresh off' }));
    await user.click(screen.getByRole('button', { name: 'Turn research alerts on' }));

    expect(screen.getByRole('button', { name: 'Turn auto refresh on' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Turn research alerts off' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'Library' }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('button', { name: 'Turn auto refresh on' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Turn research alerts off' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('auto refreshes through the backend refresh coordinator when enabled', async () => {
    vi.useFakeTimers();
    const refreshedTitle = 'Auto refreshed research signal';
    const refresher = vi.fn(async (currentState) => ({
      ...currentState,
      lastUpdatedAt: '2026-07-15T08:00:00.000Z',
      items: currentState.items.map((item, index) =>
        index === 0 ? { ...item, title: refreshedTitle, updatedAt: '2026-07-15T08:00:00.000Z' } : item
      )
    }));

    render(<App refresher={refresher} refreshIntervalMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(refresher).toHaveBeenCalledTimes(1);
    expect(screen.getByText(refreshedTitle)).toBeInTheDocument();
  });

  it('can pause, resume, and delete keywords with named controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Keywords' }));

    await user.click(screen.getByRole('button', { name: 'Pause keyword LLM Agent' }));
    expect(screen.getByRole('button', { name: 'Resume keyword LLM Agent' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await user.click(screen.getByRole('button', { name: 'Resume keyword LLM Agent' }));
    expect(screen.getByRole('button', { name: 'Pause keyword LLM Agent' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.type(screen.getByLabelText('New keyword'), 'robotics');
    await user.click(screen.getByRole('button', { name: 'Add keyword' }));
    expect(screen.getByText('robotics')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete keyword robotics' }));
    expect(screen.queryByText('robotics')).not.toBeInTheDocument();
  });

  it('never renders mojibake from cached backend samples', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByText(/�|鈥|鏈|宸/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Library' }));
    expect(screen.queryByText(/�|鈥|鏈|宸/)).not.toBeInTheDocument();
  });
});
