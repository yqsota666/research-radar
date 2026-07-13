# Research Radar App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Research Radar mobile demo from the design spec.

**Architecture:** Use a Vite + React + TypeScript single-page mobile web app that can be demoed in a browser and later wrapped or ported to React Native. Keep domain logic in testable services, with UI reading from a normalized store and refresh status updating progressively.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS modules via plain CSS, localStorage persistence, optional live fetchers with cached demo fallback.

## Global Constraints

- Do not commit API keys or local `.env` files.
- Implement Today, Feed, Keywords, Detail, Saved, and Settings pages.
- Use a unified normalized item model for all source categories.
- Show partial results while source fetching or LLM analysis is still running.
- Saved items must persist across app restart.
- Unstable sources must not block the whole app.
- Cached fallback data must be clearly labeled when used.

---

### Task 1: Project Foundation and Domain Model

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/domain/types.ts`
- Create: `src/domain/demoData.ts`
- Create: `src/domain/radar.test.ts`
- Create: `src/domain/radar.ts`

**Interfaces:**
- Produces: `RadarItem`, `KeywordConfig`, `SourceStatus`, `AppState`
- Produces: `createInitialState(now?: string): AppState`
- Produces: `getVisibleFeedItems(items: RadarItem[], filter: FeedFilter): RadarItem[]`
- Produces: `getTodaySummary(state: AppState): TodaySummary`
- Produces: `toggleSaved(items: RadarItem[], itemId: string): RadarItem[]`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/radar.test.ts` with tests for initial state, Feed filtering, Today top matches, and saved toggling.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/domain/radar.test.ts`
Expected: FAIL because `src/domain/radar.ts` does not exist.

- [ ] **Step 3: Implement domain model and pure helpers**

Create `src/domain/types.ts`, `src/domain/demoData.ts`, and `src/domain/radar.ts` with the interfaces and helpers above.

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- --run src/domain/radar.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add package.json index.html tsconfig.json tsconfig.node.json vite.config.ts src && git commit -m "feat: add Research Radar domain foundation"`

### Task 2: Refresh, Analysis, and Persistence Services

**Files:**
- Create: `src/services/storage.test.ts`
- Create: `src/services/storage.ts`
- Create: `src/services/refresh.test.ts`
- Create: `src/services/refresh.ts`

**Interfaces:**
- Consumes: `AppState`, `RadarItem`, `KeywordConfig`, `SourceStatus`
- Produces: `loadState(storage?: Storage): AppState`
- Produces: `saveState(state: AppState, storage?: Storage): void`
- Produces: `clearFeedCache(state: AppState): AppState`
- Produces: `runDemoRefresh(state: AppState, now?: string): Promise<AppState>`
- Produces: `suggestRelatedTerms(keyword: string): string[]`

- [ ] **Step 1: Write failing storage tests**

Create tests proving state loads from defaults, saves to localStorage, preserves saved items, and clears feed cache without deleting keywords.

- [ ] **Step 2: Run storage tests and verify failure**

Run: `npm test -- --run src/services/storage.test.ts`
Expected: FAIL because `src/services/storage.ts` does not exist.

- [ ] **Step 3: Implement storage service**

Implement localStorage-backed persistence with a versioned key and safe fallback to `createInitialState()`.

- [ ] **Step 4: Run storage tests and verify pass**

Run: `npm test -- --run src/services/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing refresh tests**

Create tests proving refresh returns mixed source statuses, cached WeChat fallback, analyzed items, and related-term suggestions.

- [ ] **Step 6: Run refresh tests and verify failure**

Run: `npm test -- --run src/services/refresh.test.ts`
Expected: FAIL because `src/services/refresh.ts` does not exist.

- [ ] **Step 7: Implement refresh service**

Implement a deterministic demo refresh that simulates stable sources, marks WeChat as cached, updates source statuses, and enriches items with analysis fields.

- [ ] **Step 8: Run service tests and verify pass**

Run: `npm test -- --run src/services/storage.test.ts src/services/refresh.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

Run: `git add src/services src/domain && git commit -m "feat: add radar refresh and persistence services"`

### Task 3: Mobile App UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: `createInitialState`, `getTodaySummary`, `getVisibleFeedItems`, `toggleSaved`, `loadState`, `saveState`, `runDemoRefresh`, `suggestRelatedTerms`
- Produces: A responsive mobile-first UI with Today, Feed, Keywords, Detail, Saved, and Settings tabs.

- [ ] **Step 1: Write failing UI tests**

Create tests for rendering Today by default, switching to Feed, saving an item, adding a keyword, and showing Settings source health.

- [ ] **Step 2: Run UI tests and verify failure**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 3: Implement React app**

Implement the six-page mobile demo, progressive refresh statuses, detail view, saved list, keyword suggestions, cache clearing, and source-health display.

- [ ] **Step 4: Run UI tests and verify pass**

Run: `npm test -- --run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src index.html && git commit -m "feat: build Research Radar mobile UI"`

### Task 4: Documentation and Final Verification

**Files:**
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces: Developer instructions for install, test, run, and environment configuration.

- [ ] **Step 1: Write README**

Document the app purpose, setup commands, demo flow, `.env` security note, and fallback-source behavior.

- [ ] **Step 2: Run full verification**

Run: `npm test -- --run`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

Run: `git add README.md package.json package-lock.json && git commit -m "docs: add Research Radar run instructions"`
