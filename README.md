# Research Radar

Research Radar is a mobile-first AI research intelligence radar for graduate students and research teams. It tracks recent AI research and developer signals by keyword, normalizes items from multiple sources, analyzes them into concise cards, and keeps the UI intentionally lightweight.

The product goal is simple: show the most useful research signals quickly, without turning the home screen into an admin dashboard.

## What It Does

- Tracks active research keywords such as `LLM Agent`, `RAG`, and `Diffusion`.
- Pulls live or cached items from papers, GitHub repositories, technology news, model sources, and Chinese AI media placeholders.
- Converts raw source items into readable research cards with summaries, tags, source labels, and detail pages.
- Highlights 5 Top Matches on the Today screen with Top Matches diversity across keywords when possible.
- Lets users search, filter, sort, open details, save items, and review saved research later.
- Shows source health and LLM configuration status in Settings.
- Supports auto refresh through the backend refresh coordinator.
- Keeps API keys and local env files out of source control.

## Product Experience

The app is designed for an iPhone-sized mobile viewport. It uses a dark, minimal, Apple Notes-inspired interface with a restrained technology feel.

### Main Navigation

The app has three primary tabs:

- `Today`: concise current research signal overview and Top Matches.
- `Library`: searchable/filterable/sortable list of all research cards, plus the Saved subview.
- `Settings`: lightweight controls for keywords, sources, refresh, alerts, and AI analysis status.

The main navigation is a fixed bottom floating bar. It stays in the same lower-screen position while the user scrolls content.

### Today

Today is the default screen. It shows:

- Last updated time.
- Research Radar heading.
- Auto refresh or analysis state.
- A compact Today signal card.
- Active keyword chips.
- Top Matches with 5 selected items.

Relevance scores are intentionally not shown to users. Ranking is used internally, while the UI stays human-readable.

### Library

Library is the full research inbox. It supports:

- Text search.
- Source filtering.
- Sorting.
- Saved reading list.
- Empty states.
- Card detail navigation.

Cards show a short summary first. Details, reasoning, original links, and save actions are available after opening a card.

### Detail

The Detail view shows:

- Source badge.
- Full title.
- Source and published time.
- Summary.
- Why it matters.
- Tags.
- Save action.
- Original link.

### Saved

Saved is accessed from Library. It displays items the user has saved locally. Saved state persists in browser `localStorage`.

### Settings

Settings is intentionally compact and user-facing. It includes:

- `Keywords`: add, pause/resume, and delete tracked research topics.
- `Sources`: view source status for papers, GitHub, news, model sources, and Chinese AI media placeholders.
- `Auto refresh`: enable or disable periodic refresh.
- `Research alerts`: local UI setting for future alert behavior.
- `AI analysis`: LLM gateway status, including missing key, invalid base URL, configured, connected, or last check failed.

Settings displays Check Gateway status and does not display the API key value.

## Data and Backend Logic

This project is currently a Vite/React app with backend-like logic implemented in local service modules. There is no separate server process yet.

Core logic lives in:

- `src/domain`: app state types, demo data, ranking, filtering, Top Matches diversity, saved toggling.
- `src/services`: source adapters, refresh coordinators, LLM config checks, LLM analysis, storage, and fallback logic.
- `src/app`: React screens and UI behavior.
- `src/styles`: Tailwind and global styling.

## Source Refresh Pipeline

The current implementation uses a multi-keyword live refresh loop.

For every enabled keyword, `runLiveRefresh`:

1. Reads the sources selected for that keyword.
2. Calls only the adapters for those sources.
3. Passes keyword and related terms into each adapter.
4. Normalizes raw source items.
5. Analyzes each item into a radar card.
6. Deduplicates items by external ID or URL.
7. Preserves saved items.
8. Updates source status.
9. Falls back to safe cached data when needed.

Live adapters currently cover:

- GitHub Search for repositories.
- Hacker News Algolia for technology news.
- arXiv for papers.

Because arXiv can fail from browser networking or CORS-like restrictions, the paper adapter includes an arXiv browser-safe fallback. When live paper fetch fails, Papers still shows a cached fallback sample and source status is marked as cached rather than silently disappearing.

Machine Heart / WeChat and Hugging Face remain clearly labeled cached demo sources until their live adapters are enabled.

Source requests include timeouts so slow external sources do not block the entire refresh. The live refresh coordinator isolates adapter exceptions so one failing source does not stop the remaining sources from refreshing.

## LLM Behavior

The app supports OpenAI-compatible gateway configuration through environment variables.

LLM-related behavior includes:

- Local config validation.
- Gateway connectivity check.
- Lightweight structured analysis requests through `analyzeWithLlm`.
- Low-latency request defaults.
- JSON response parsing.
- Heuristic fallback when config is missing or the LLM request fails.
- No API key display in the UI.

For local LLM or gateway integration, create a local env file that is not committed:

```bash
VITE_OPENAI_API_KEY=<provided outside source control>
VITE_OPENAI_BASE_URL=https://gmncode.cn/v1
VITE_OPENAI_MODEL=<optional OpenAI-compatible model>
```

Do not commit `.env` files or API keys.

## Local Storage

The app uses browser `localStorage` for:

- App state cache.
- Saved items.
- Keyword changes.
- Settings such as auto refresh and research alerts.

Storage helpers live in `src/services/storage.ts`.

## Project Structure

```text
.
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── main.tsx
│   ├── app
│   │   └── App.tsx
│   ├── domain
│   │   ├── demoData.ts
│   │   ├── radar.ts
│   │   ├── radar.test.ts
│   │   └── types.ts
│   ├── docs
│   │   └── readme.test.ts
│   ├── services
│   │   ├── analysis.ts
│   │   ├── backendContracts.test.ts
│   │   ├── liveRefresh.ts
│   │   ├── llmAnalysis.ts
│   │   ├── llmConfig.ts
│   │   ├── refresh.ts
│   │   ├── sourceAdapters.ts
│   │   └── storage.ts
│   └── styles
│       ├── fonts.css
│       ├── globals.css
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
```

## Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Vite defaults to `http://127.0.0.1:5173`. If that port is busy, Vite may choose the next available port, such as `5177`.

Build production assets:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Test Commands

Run the full test suite:

```bash
npm test -- --run
```

Run only app UI tests:

```bash
npm test -- --run src/App.test.tsx
```

Run only backend/domain service tests:

```bash
npm test -- --run src/services src/domain
```

## Current Test Coverage

The repository includes tests for:

- Main mobile UI flows.
- Top Matches behavior.
- Library search, source filtering, and sorting.
- Detail and save flow.
- Settings switches and keyword management.
- No mojibake in cached UI content.
- Auto refresh through the backend refresh coordinator.
- Domain ranking, filtering, and saved toggling.
- Source adapter normalization and timeout behavior.
- Live refresh dedupe, saved preservation, fallback, and adapter error isolation.
- LLM config status and key redaction.
- LLM structured analysis and heuristic fallback.
- Storage helpers.
- README documentation expectations.
- Backend contract smoke coverage across core service entry points.

## Important Implementation Notes

- The UI must remain English-only and should not display mojibake.
- The home screen should stay concise; complex logic belongs in services/domain code.
- Do not show relevance scores to users.
- Top Matches should remain prominent and limited to 5 items.
- Source status should remain visible in Settings.
- Keywords are a core feature, but the UI should stay lightweight.
- Navigation is a bottom fixed floating bar and should remain visible while scrolling.
- API keys must never be committed or displayed.

## Git Hygiene

Ignored or local-only artifacts include:

- `.env*`
- `.generated-ui/`
- `Generate designs from markdown.zip`
- Build outputs such as `dist/`

Before pushing, run:

```bash
npm test -- --run
npm run build
git status -sb
```

Only stage intended files. Do not accidentally commit local research notes, zip files, generated UI staging folders, or API keys.
