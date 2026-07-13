import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('README live refresh documentation', () => {
  it('documents round-2 live refresh, fallback, and LLM config behavior', () => {
    const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('multi-keyword live refresh');
    expect(readme).toContain('arXiv browser-safe fallback');
    expect(readme).toContain('VITE_OPENAI_API_KEY');
    expect(readme).toContain('does not display the API key');
    expect(readme).toContain('Top Matches diversity');
    expect(readme).toContain('Check Gateway');
  });
});
