# Research Radar Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the second-stage engineering loop from the spec: real source adapters, partial refresh coordination, fallback behavior, and analysis abstraction.

**Architecture:** Keep UI separate from integration logic. Add source adapters that normalize external data, an analysis service that can use local deterministic scoring now and an OpenAI-compatible gateway later, and a refresh coordinator that merges fetched results into the existing normalized store while preserving saved items.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, browser `fetch`, DOMParser XML parsing, local fallback demo data.

## Global Constraints

- Do not commit API keys or local `.env` files.
- A failed source must not fail the whole refresh.
- Cached fallback data must be clearly labeled when used.
- Source fetching, analysis, and UI rendering must stay separated enough to test independently.
- Stable sources for phase 2 are arXiv, GitHub Search, and Hacker News Algolia news search.

---

### Task 1: Source Adapter Contract and Parsers

**Files:**
- Create: `src/services/sourceAdapters.test.ts`
- Create: `src/services/sourceAdapters.ts`

**Interfaces:**
- Produces: `SourceFetchResult`
- Produces: `SourceAdapter`
- Produces: `arxivAdapter`
- Produces: `githubAdapter`
- Produces: `newsAdapter`

- [ ] **Step 1: Write failing adapter tests**

Test arXiv XML parsing, GitHub JSON normalization, Hacker News JSON normalization, and adapter failure result shape.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/services/sourceAdapters.test.ts`
Expected: FAIL because `sourceAdapters.ts` does not exist.

- [ ] **Step 3: Implement adapters**

Implement adapter functions with injected `fetch` support and normalized raw items.

- [ ] **Step 4: Run tests and verify pass**

Run: `npm test -- --run src/services/sourceAdapters.test.ts`
Expected: PASS.

### Task 2: Analysis and Live Refresh Coordinator

**Files:**
- Create: `src/services/analysis.test.ts`
- Create: `src/services/analysis.ts`
- Create: `src/services/liveRefresh.test.ts`
- Create: `src/services/liveRefresh.ts`

**Interfaces:**
- Produces: `analyzeRawItem(rawItem, keyword): AnalysisResult`
- Produces: `runLiveRefresh(state, options): Promise<AppState>`

- [ ] **Step 1: Write failing analysis tests**

Test relevance scoring, tags, summary fallback, and reason generation.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/services/analysis.test.ts`
Expected: FAIL because `analysis.ts` does not exist.

- [ ] **Step 3: Implement analysis service**

Implement deterministic local analysis that matches the LLM output schema and can later be replaced by an API client.

- [ ] **Step 4: Run analysis tests and verify pass**

Run: `npm test -- --run src/services/analysis.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing live refresh tests**

Test partial success, deduplication, saved-state preservation, and fallback labeling.

- [ ] **Step 6: Run live refresh tests and verify failure**

Run: `npm test -- --run src/services/liveRefresh.test.ts`
Expected: FAIL because `liveRefresh.ts` does not exist.

- [ ] **Step 7: Implement live refresh coordinator**

Use source adapters, analysis service, deduplication, source statuses, and cached fallback merge.

- [ ] **Step 8: Run service tests and verify pass**

Run: `npm test -- --run src/services/analysis.test.ts src/services/liveRefresh.test.ts`
Expected: PASS.

### Task 3: UI Uses Live Refresh Path

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `runLiveRefresh`
- Produces: Refresh UI that shows live/fallback status and continues to pass existing app behavior.

- [ ] **Step 1: Add failing UI test for live refresh status**

Test that clicking Refresh keeps the app usable and shows source status messages from the coordinator.

- [ ] **Step 2: Run UI test and verify failure**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL until App uses `runLiveRefresh`.

- [ ] **Step 3: Wire App refresh to live coordinator**

Replace demo refresh call with live refresh and add small status copy for updated source health.

- [ ] **Step 4: Run full verification**

Run: `npm test -- --run`
Expected: PASS.

Run: `npm run build`
Expected: PASS.
