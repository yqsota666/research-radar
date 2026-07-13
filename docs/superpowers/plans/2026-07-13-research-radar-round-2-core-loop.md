# Research Radar Round 2 Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the P0 + P1 core loop requested for the second coding round.

**Architecture:** Keep integration logic testable in services. `runLiveRefresh` should traverse enabled keywords and their configured sources, adapters should provide safe fallback where browser fetches are unreliable, LLM config should be represented as a non-secret status model, and Today should surface source status plus update time.

**Tech Stack:** React 19, TypeScript, Vite env variables, Vitest, Testing Library.

## Global Constraints

- Do not expose or render API key values.
- Do not let paper results disappear when arXiv fails.
- Respect each enabled keyword's selected sources.
- Keep README aligned with live refresh behavior.
- Do not add extra P2 polish outside this scoped loop.

---

### Task 1: Multi-keyword Live Refresh and Paper Fallback

**Files:**
- Modify: `src/services/liveRefresh.test.ts`
- Modify: `src/services/sourceAdapters.test.ts`
- Modify: `src/services/sourceAdapters.ts`
- Modify: `src/services/liveRefresh.ts`

**Interfaces:**
- `runLiveRefresh(state, options): Promise<AppState>`
- `arxivAdapter.fetch(keyword, relatedTerms, options): Promise<SourceFetchResult>`

- [ ] Write failing tests for multi-keyword/source traversal and matchedKeyword preservation.
- [ ] Write failing test for arXiv browser-safe cached fallback sample.
- [ ] Implement adapter lookup by source and refresh job generation per enabled keyword/source.
- [ ] Implement paper cached fallback when arXiv fails.
- [ ] Run targeted tests and commit.

### Task 2: LLM Config Status Model

**Files:**
- Create: `src/services/llmConfig.test.ts`
- Create: `src/services/llmConfig.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- `getLlmConfigStatus(env?: Record<string, string | undefined>): LlmConfigStatus`

- [ ] Write failing tests for missing key, invalid base URL, and configured status.
- [ ] Implement non-secret config status derived from Vite env.
- [ ] Wire Settings to display status without rendering the key.
- [ ] Run targeted tests and commit.

### Task 3: Today Status Strip and README Sync

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Today source strip shows source label, status tag, and last update time.

- [ ] Write failing UI test for Today source status labels and timestamps.
- [ ] Implement Today source strip status details.
- [ ] Update README with multi-keyword live refresh, fallback, and LLM status notes.
- [ ] Run full tests and build.
- [ ] Commit.
