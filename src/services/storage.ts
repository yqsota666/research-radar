import { createInitialState } from '../domain/radar';
import type { AppState } from '../domain/types';

export const STORAGE_KEY = 'research-radar-state-v1';

function getDefaultStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function loadState(storage = getDefaultStorage()): AppState {
  if (!storage) {
    return createInitialState();
  }

  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(stored) as AppState;
    if (!Array.isArray(parsed.keywords) || !Array.isArray(parsed.items)) {
      return createInitialState();
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState, storage = getDefaultStorage()): void {
  storage?.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearFeedCache(state: AppState): AppState {
  return {
    ...state,
    items: state.items.filter((item) => item.saved),
    lastUpdatedAt: new Date().toISOString()
  };
}
