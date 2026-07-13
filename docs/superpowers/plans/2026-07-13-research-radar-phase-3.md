# Research Radar Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 3 final-demo clarity and trust improvements from the updated PM notes.

**Architecture:** Keep ranking diversity in domain helpers, gateway health in a testable service, and mobile source-filter polish in App/CSS without expanding into unrelated P2 interactions.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite env.

## Global Constraints

- Do not expose API keys in UI, logs, tests, or README.
- Today must visibly represent multiple keywords when eligible items exist.
- Feed relevance sorting must remain unaffected by Today diversity.
- Gateway checks must be manual, non-fatal, and mocked in tests.
- Mobile filter polish should avoid whole-page horizontal overflow.

---

### Task 1: Top Matches Diversity

**Files:**
- Modify: `src/domain/radar.test.ts`
- Modify: `src/domain/radar.ts`

**Interfaces:**
- `getTodaySummary(state): TodaySummary`

- [ ] Write failing tests for tied-score keyword diversity and high-score precedence.
- [ ] Implement first-pass per-keyword diversity, then fill remaining slots by score.
- [ ] Run targeted domain tests and commit.

### Task 2: LLM Gateway Manual Check

**Files:**
- Modify: `src/services/llmConfig.test.ts`
- Modify: `src/services/llmConfig.ts`
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `checkLlmGateway(env, fetcher): Promise<LlmConfigStatus>`

- [ ] Write failing service tests for connected and last-check-failed states.
- [ ] Implement a redacted manual gateway check using `/models`.
- [ ] Write failing UI test for Check Gateway success/failure display.
- [ ] Wire Settings button to the service and keep fetched results intact.
- [ ] Run targeted tests and commit.

### Task 3: Mobile Source Filter Polish

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Feed source filters use short labels and wrap safely on mobile.

- [ ] Add UI test for short mobile labels.
- [ ] Replace long segmented labels with short visible labels plus accessible names.
- [ ] Constrain/wrap segmented control to avoid horizontal page overflow.
- [ ] Run full tests, build, and browser mobile smoke check.
- [ ] Commit.
