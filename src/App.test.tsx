import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('Research Radar app', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders Today as the default mobile dashboard', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Research Radar' })).toBeInTheDocument();
    expect(screen.getByText('Top Matches')).toBeInTheDocument();
    expect(screen.getAllByText('LLM Agent').length).toBeGreaterThan(0);
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
  });
});
