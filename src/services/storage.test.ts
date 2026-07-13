import { describe, expect, it } from 'vitest';
import { createInitialState } from '../domain/radar';
import { clearFeedCache, loadState, saveState } from './storage';

function freshStorage(): Storage {
  window.localStorage.clear();
  return window.localStorage;
}

describe('state storage service', () => {
  it('loads the default state when storage is empty', () => {
    const storage = freshStorage();

    const state = loadState(storage);

    expect(state.keywords).toHaveLength(3);
    expect(state.items.length).toBeGreaterThan(0);
  });

  it('saves and restores radar state', () => {
    const storage = freshStorage();
    const state = createInitialState('2026-07-13T05:00:00.000Z');
    state.items[0] = { ...state.items[0], saved: true };

    saveState(state, storage);
    const restored = loadState(storage);

    expect(restored.lastUpdatedAt).toBe('2026-07-13T05:00:00.000Z');
    expect(restored.items[0].saved).toBe(true);
  });

  it('falls back to defaults when saved data is invalid', () => {
    const storage = freshStorage();
    storage.setItem('research-radar-state-v1', '{bad json');

    const state = loadState(storage);

    expect(state.keywords.map((keyword) => keyword.term)).toContain('LLM Agent');
  });

  it('clears feed cache while preserving keywords and saved items', () => {
    const state = createInitialState();
    const savedItem = { ...state.items[0], saved: true };

    const cleared = clearFeedCache({
      ...state,
      items: [savedItem, ...state.items.slice(1)]
    });

    expect(cleared.keywords).toEqual(state.keywords);
    expect(cleared.items).toEqual([savedItem]);
  });
});
