# Research Radar Product Design

## 1. Project Context

Course: COMP7506D Smart Phone Apps Development group project.

Project type: Mobile app demo for a research and developer productivity tool.

Working title: Research Radar.

One-line positioning:
Research Radar is a mobile intelligence radar that lets researchers and developers subscribe to keywords, pull related technology news, papers, repositories, and model updates from the internet, then use an LLM to summarize, tag, and score each item.

Target users:
- Computer science and AI master's students.
- Research-oriented developers.
- Students looking for paper ideas, project inspiration, and technology trends.

Core value:
- Reduce time spent checking scattered sources.
- Convert multi-source technical updates into short, ranked, actionable cards.
- Help users follow a topic such as "LLM Agent", "RAG", "Diffusion", or "Robotics" across news, papers, GitHub, Hugging Face, and Chinese AI media.

## 2. Product Scope

The demo focuses on a complete loop:

1. User configures keywords and data sources.
2. App fetches real online content from multiple sources.
3. App calls an OpenAI-compatible LLM gateway to summarize, tag, and score each item.
4. User browses ranked results on Today and Feed pages.
5. User opens a detail page and saves useful content.
6. Saved items become a lightweight reading list.

Out of scope for the demo:
- Full user account system.
- Social sharing and comments.
- Push notifications.
- Long-form chat with papers.
- Complete production-grade crawling for all WeChat public account content.

## 3. App Information Architecture

The first demo version has six pages.

### 3.1 Today

Purpose:
The landing page. It gives an immediate overview of today's relevant technology and research updates.

Main components:
- Header with app name, active keyword count, and refresh button.
- Active keyword chips, such as `LLM Agent`, `RAG`, `Diffusion`.
- Metric cards:
  - Total matched items.
  - Papers count.
  - GitHub projects count.
  - News count.
  - Hugging Face count.
  - Chinese media or WeChat count.
- Source distribution module.
- Top Matches list with 3 to 5 highest-scoring cards.
- Last updated time and data-source status.

Content card fields:
- Source type badge.
- Title.
- One-sentence LLM summary.
- Relevance score.
- Matched keyword.
- Tags.
- Save action.

Demo role:
This page is the opening screen for the presentation because it shows the app value within a few seconds.

### 3.2 Feed

Purpose:
A unified inbox for all fetched content.

Main components:
- Search bar for local filtering.
- Source tabs: All, News, Papers, GitHub, Hugging Face, WeChat.
- Sort controls:
  - Relevance score.
  - Publish time.
  - Source type.
- Content card list.
- Empty state for no matching results.
- Loading state while fetching and analyzing.

Card behavior:
- Tap a card to open Detail.
- Tap save icon to add to Saved.
- Tap source badge to filter by source.

### 3.3 Keywords

Purpose:
The configuration center for the personal radar.

Main components:
- Keyword list.
- Add keyword input.
- Per-keyword enable or pause switch.
- Source selector for each keyword:
  - Technology News.
  - Academic Papers.
  - GitHub.
  - Hugging Face.
  - Machine Heart or WeChat.
- LLM related-term suggestions.
- Keyword detail drawer or sheet.

Example keyword configuration:

```text
Keyword: LLM Agent
Sources: Papers, GitHub, Hugging Face, News, WeChat
Related suggestions: multi-agent, tool use, workflow automation
Enabled: true
```

LLM related-term behavior:
- The user enters one keyword.
- The app asks the LLM for 3 related terms.
- The user can accept or ignore the suggestions.
- Accepted terms are used as additional matching hints, not as separate subscriptions unless the user explicitly adds them.

### 3.4 Detail

Purpose:
Show the full structured result for one item.

Main components:
- Title.
- Source name, source type, and publish time.
- Original URL button.
- LLM summary.
- Tags.
- Relevance score.
- Matched keyword.
- Recommendation reason.
- Save or unsave action.

Recommended reason example:

```text
Recommended because this paper discusses LLM agents and tool use, and introduces an evaluation benchmark relevant to your "LLM Agent" keyword.
```

### 3.5 Saved

Purpose:
A reading list for useful results.

Main components:
- Saved content list.
- Filter by source type.
- Filter by tags.
- Saved time.
- Remove from saved.
- Open original link.

Demo role:
Shows that the app is not just a feed, but a productivity tool for collecting research and development leads.

### 3.6 Settings / Sources

Purpose:
Make the technical demo transparent and manageable.

Main components:
- LLM gateway status.
- Data-source toggles.
- Last fetch time.
- Per-source health status.
- API configuration instructions.
- Clear cache button for demo reset.

LLM configuration:

```bash
OPENAI_API_KEY=<provided outside source control>
OPENAI_BASE_URL=https://gmncode.cn/v1
```

Security note:
The API key must be provided through environment variables or a local ignored `.env` file. It must not be hardcoded in source code or committed to git.

## 4. Data Sources

The product supports five source categories.

### 4.1 Technology News

Possible sources:
- TechCrunch.
- The Verge.
- Wired.
- Ars Technica.
- MIT Technology Review.
- 36Kr or other Chinese technology media if stable access is available.

Recommended demo implementation:
- Prefer RSS feeds or public pages that are easy to parse.
- Store source name, title, URL, publish time, and snippet.

### 4.2 Academic Papers

Possible sources:
- arXiv API.
- Papers with Code trending pages, if accessible.
- Semantic Scholar API, if an API key is available.

Recommended demo implementation:
- Use arXiv as the primary stable academic source.
- Query by keyword.
- Fetch title, authors, abstract, URL, and publish date.

### 4.3 GitHub

Possible sources:
- GitHub Search API.
- GitHub Trending page.
- GitHub repository metadata.

Recommended demo implementation:
- Use GitHub Search API for keyword-based repository search.
- Use stars, recent update time, language, and description as ranking signals before LLM scoring.

### 4.4 Hugging Face

Possible sources:
- Hugging Face papers pages.
- Hugging Face model search or public pages.
- Hugging Face APIs if available for the chosen endpoint.

Recommended demo implementation:
- Use Hugging Face as an AI-specific source for papers or models.
- Capture title, model or paper URL, likes/downloads if available, and short description.

### 4.5 Machine Heart / WeChat

Possible sources:
- Machine Heart official website, if accessible.
- Search-engine result pages that index Machine Heart articles.
- WeChat public account pages when accessible.

Recommended demo implementation:
- Treat this as an enhanced Chinese AI media source.
- Avoid making it the only path for a demo because WeChat content can be unstable or difficult to crawl.
- If direct public account scraping is blocked, use a fallback source such as indexed article URLs or a small cached sample clearly marked as cached demo data.

## 5. LLM Processing

The LLM is used for structured analysis, not open-ended chat.

Input:
- User keyword.
- Optional related terms.
- Source item title.
- Source item snippet or abstract.
- Source type.
- Source URL.

Output schema:

```json
{
  "summary": "string",
  "tags": ["string"],
  "relevanceScore": 0,
  "reason": "string"
}
```

Processing rules:
- Summary should be 1 to 2 short sentences.
- Tags should contain 3 to 5 technical terms.
- Relevance score should be from 0 to 100.
- Reason should explain why the item matches the user's keyword.
- Items below a chosen score threshold can be hidden from Today but still available in Feed.

Suggested threshold:
- Today Top Matches: score >= 80.
- Feed visible items: score >= 50.

## 6. Unified Data Model

Every source item is normalized to the same model.

```text
id
title
sourceType: news | paper | github | huggingface | wechat
sourceName
url
publishedAt
matchedKeyword
rawSnippet
summary
tags
relevanceScore
reason
saved
fetchedAt
```

Recommended engineering extensions:

```text
externalId
sourceStatus: pending | fetched | failed | cached
sourceUpdatedAt
analysisStatus: pending | analyzing | done | failed
analysisError
scoreVersion
isCachedSample
createdAt
updatedAt
```

Benefits:
- Today and Feed can render all content with one card component.
- Saved can reuse the same item structure.
- LLM output is source-independent.
- Status fields let the UI show partially loaded results instead of waiting for every source and every LLM call to finish.
- `externalId` and URL-based fingerprints make cross-source deduplication possible.
- `scoreVersion` allows future prompt or scoring changes without confusing old and new scores.

## 7. Interaction Flow

### 7.1 First Use

1. User opens app.
2. App shows a default keyword set for demo, such as `LLM Agent`, `RAG`, and `Diffusion`.
3. User taps refresh.
4. App fetches content and shows loading states.
5. LLM processing fills summaries, tags, scores, and reasons.
6. Today page updates with Top Matches.

### 7.2 Add Keyword

1. User opens Keywords.
2. User enters `multi-agent`.
3. App suggests related terms such as `tool use`, `agent workflow`, and `agent benchmark`.
4. User selects sources.
5. User saves the keyword.
6. App refreshes results for the new keyword.

### 7.3 Save Useful Item

1. User opens Feed.
2. User filters by Papers.
3. User opens a paper detail page.
4. User reads summary and reason.
5. User taps Save.
6. Item appears in Saved.

## 8. Competitor Research Direction

The project document should research at least three comparable apps or services.

Recommended competitors:

### 8.1 Google News

Why relevant:
- It aggregates news from many sources.
- It supports topic-based personalization.

What to analyze:
- Strength: broad coverage and familiar feed experience.
- Weakness: not research-focused and does not connect papers, repositories, and models.
- Opportunity for Research Radar: focus on developer and academic signals, not general news.

### 8.2 Feedly

Why relevant:
- It is a mature RSS and topic-following tool.
- It supports professional information monitoring.

What to analyze:
- Strength: source management and feed organization.
- Weakness: users must configure many sources manually; paper/GitHub/Hugging Face analysis is not the core experience.
- Opportunity for Research Radar: keyword-based technical intelligence with LLM summaries and relevance scoring.

### 8.3 Papers with Code

Why relevant:
- It connects machine learning papers, code, datasets, and benchmarks.

What to analyze:
- Strength: excellent for ML paper and code discovery.
- Weakness: not a general mobile personal radar and not designed around user-defined multi-source keywords.
- Opportunity for Research Radar: combine papers with GitHub, Hugging Face, news, and Chinese AI media in one mobile workflow.

Optional fourth competitor:

### 8.4 GitHub Trending

Why relevant:
- Developers use it to discover popular repositories.

What to analyze:
- Strength: clear popularity signal.
- Weakness: repository-focused only; no paper or news context.
- Opportunity for Research Radar: explain why a trending repo matters to the user's research keyword.

## 9. Development Boundary

Recommended technology:
- Cross-platform mobile framework: Flutter or React Native.
- Local state: in-memory state plus local storage for keywords and saved items.
- Network layer: source-specific fetchers.
- LLM layer: OpenAI-compatible API client using `OPENAI_BASE_URL`.
- Optional backend: not required for first demo unless web crawling needs a proxy.

Recommended demo boundary:
- Real fetching for at least three stable sources.
- LLM analysis for fetched items.
- UI support for all six pages.
- Graceful fallback or cached sample for unstable sources such as WeChat.

Minimum viable demo:
- Today, Feed, Keywords, Detail, Saved, Settings pages.
- Keyword configuration.
- Real network fetch for news, arXiv, and GitHub.
- LLM summary, tags, score, and reason.
- Save item locally.

Enhanced demo:
- Add Hugging Face source.
- Add Machine Heart or WeChat source.
- Add source health indicators.
- Add related-term suggestions from the LLM.

## 10. Engineering Supplement

This section adds implementation guidance from a technical perspective. The goal is to make the demo feel smooth on mobile while keeping the backend simple enough for a course project.

### 10.1 Recommended Architecture

Use a three-layer structure:

1. Mobile UI layer:
   - Pages, cards, filters, refresh controls, saved list, and local persistence.
   - Reads from a local normalized item store instead of directly waiting on network requests.

2. Application service layer:
   - Keyword manager.
   - Refresh coordinator.
   - Source fetcher registry.
   - LLM analysis queue.
   - Cache and deduplication helpers.

3. External integration layer:
   - Source-specific clients for RSS/news, arXiv, GitHub, Hugging Face, and Chinese AI media.
   - OpenAI-compatible LLM client.
   - Optional lightweight proxy backend if direct mobile requests hit CORS, API key, rate-limit, or scraping limitations.

Recommendation:
- For a fast demo, keep keyword and saved data local on the device.
- Put source fetching and LLM calls behind one service interface even if they initially run inside the app.
- If API key exposure or unstable crawling becomes a concern, move only the fetch/analyze service to a small backend instead of redesigning the whole app.

### 10.2 Frontend Smoothness Requirements

The app should not feel blocked by slow internet or LLM latency.

Required UI behavior:
- Show cached or last successful results immediately when the app opens.
- Use pull-to-refresh on Today and Feed.
- Refresh per source in parallel and update source status independently.
- Render raw fetched cards first when possible, then fill empty analysis fields with LLM summary, tags, score, and reason after analysis completes.
- Keep list scroll position stable while new results arrive.
- Show skeleton cards during initial load and small inline spinners for cards still being analyzed.
- Use optimistic UI for Save and Unsave, then persist locally.
- Disable repeated refresh taps while a refresh is already running, but allow cancel or retry after failure.
- Show per-source status in Settings and Today, for example `GitHub updated`, `arXiv analyzing`, `WeChat using cached sample`.

Recommended mobile states:
- Empty state: no keyword or no matching result.
- Loading state: first fetch or first analysis.
- Partial success state: some sources succeeded and some failed.
- Cached state: showing previous results because live fetch failed.
- Rate-limited state: show clear source-level message and retry time if known.

Important UI opinion:
Today should prioritize clarity over completeness. Feed can show all items, but Today should show only high-confidence cards and should never be visually overwhelmed by low-score or still-analyzing content.

### 10.3 Backend / Service Refresh Flow

The refresh flow should be incremental and observable.

Recommended flow:

1. User taps refresh or app starts scheduled manual refresh.
2. Refresh coordinator reads enabled keywords and selected sources.
3. For each `(keyword, source)` pair, enqueue a fetch job.
4. Fetch jobs run in parallel with a small concurrency limit.
5. Each source adapter normalizes results into the unified data model.
6. Deduplication removes repeated items by URL, source-specific ID, title similarity, and publish date.
7. New or changed items are stored with `analysisStatus = pending`.
8. LLM analysis jobs run in batches or small parallel groups.
9. Each analysis result updates the item summary, tags, score, reason, and `analysisStatus`.
10. UI receives updates through state management and re-renders affected cards only.

Concurrency guidance:
- Fetch concurrency: 3 to 5 source requests at a time.
- LLM analysis concurrency: 1 to 3 requests at a time to avoid rate-limit failures.
- Timeout per source request: 8 to 12 seconds.
- Timeout per LLM request: 20 to 40 seconds.
- A failed source must not fail the whole refresh.

For demo stability:
- Always keep a small cached sample set for unstable sources.
- Prefer real-time fetch for stable sources: arXiv, GitHub, and RSS/news.
- Mark fallback sample items with `isCachedSample = true` so the demo remains honest.

### 10.4 Source Adapter Contract

Every source should implement the same internal contract:

```text
fetch(keyword, relatedTerms, options) -> SourceFetchResult
```

`SourceFetchResult` should include:

```text
sourceType
sourceName
items[]
fetchedAt
status: success | partial | failed | cached
errorMessage
nextRetryAt
```

Each raw item should be normalized before it enters the shared store:

```text
externalId
title
url
publishedAt
authorsOrOwner
rawSnippet
metadata
```

Adapter rules:
- Adapters should never return UI-specific objects.
- Adapters should report partial success when they can fetch some items but not all metadata.
- Adapters should hide source-specific parsing details from the UI.
- The coordinator, not each adapter, should decide whether to send items to LLM analysis.

### 10.5 LLM Processing Strategy

The LLM is a bottleneck, so the product should treat analysis as an asynchronous enrichment step.

Recommended rules:
- Analyze only new or changed items.
- Cache LLM outputs by item fingerprint plus prompt version.
- Limit input length by trimming snippets or abstracts before sending to the LLM.
- Use strict JSON output and validate it before storing.
- If JSON parsing fails, retry once with a repair prompt or mark analysis as failed.
- If analysis fails, keep the raw item visible in Feed with a clear `summary unavailable` state.
- Use deterministic settings when possible, such as low temperature, so scores are stable during the demo.

Prompt versioning:
- Store a simple `scoreVersion`, for example `radar-v1`.
- When the prompt changes, only re-analyze items if needed.

Recommended batch policy:
- For the demo, analyze the top 20 to 30 newest or most promising items first.
- Defer low-quality or duplicate-looking items.
- Today should wait only for the first useful set of analyzed cards, not the full queue.

### 10.6 Data Storage and Caching

Minimum local storage:
- Keywords and source settings.
- Saved item IDs.
- Normalized fetched items.
- LLM analysis result.
- Last successful refresh metadata.

Cache policy:
- Keep recent items for 7 to 14 days.
- Re-fetch a source if its last successful fetch is older than 30 to 60 minutes during active demo use.
- Preserve saved items even if they age out of the normal feed cache.
- Clear cache from Settings should remove feed data but should not delete keyword settings unless the user confirms.

Deduplication policy:
- Primary key: source-specific external ID when available.
- Secondary key: normalized canonical URL.
- Fallback key: normalized title plus source type plus publish date.
- If two sources point to the same paper or repo, prefer the richer metadata but keep source attribution.

### 10.7 API and Security Notes

If a backend is added, keep the API small:

```text
GET /health
GET /sources/status
POST /refresh
GET /items?keyword=&source=&sort=
POST /items/{id}/analyze
POST /keywords/suggest
```

Security requirements:
- Never expose the LLM API key in a committed client file.
- If the mobile app calls the LLM directly for demo convenience, use local environment configuration and document that this is not production-safe.
- Add request logging without storing full API keys or full private prompts.
- Apply simple rate limiting to refresh and analysis endpoints if a backend exists.

### 10.8 Error Handling and Degradation

The user should always understand what happened.

Failure examples and expected behavior:
- arXiv succeeds, GitHub fails: show arXiv results and mark GitHub as failed.
- LLM times out: show raw cards in Feed and let the user retry analysis.
- WeChat source is blocked: use cached sample and label it as cached demo data.
- No items match a keyword: show an empty state with a suggestion to broaden the keyword.
- API key missing: Settings should show configuration error before the user starts a refresh.

Do not use a single global error modal for all refresh problems. Source-level and card-level errors are easier to recover from and make the demo feel more robust.

### 10.9 Testing and Verification

Recommended tests:
- Unit tests for keyword matching, deduplication, score filtering, and source adapter normalization.
- Mock network tests for each stable source adapter.
- LLM client tests using mocked JSON responses and malformed responses.
- UI state tests for loading, partial success, empty, cached, saved, and failed states.
- Manual demo test with network disabled after cached data has been loaded.

Acceptance checklist before demo:
- App opens with no crash when API key is missing.
- App can fetch at least three real source categories.
- A failed source does not block Today or Feed.
- Pull-to-refresh updates statuses progressively.
- Saved items remain after app restart.
- LLM summaries appear on cards and detail pages.
- Demo can still run with cached fallback data if one external source is unavailable.

### 10.10 Technical Risks and Suggestions

Key risks:
- WeChat and some Chinese media pages may be hard to crawl reliably.
- GitHub and LLM APIs may hit rate limits during repeated demo rehearsals.
- LLM latency may make the app feel frozen if analysis blocks rendering.
- Source result quality may vary by keyword.
- Client-side API keys are risky if the app is shared publicly.

Suggestions:
- Treat WeChat as an optional enhanced source, not a critical path.
- Make arXiv, GitHub, and RSS/news the reliable demo foundation.
- Build a visible source-health module early because it helps both users and presenters explain partial failures.
- Implement cached fallback data before adding the least stable source.
- Separate fetch status from analysis status in the data model so the UI can show useful progress.
- Keep the first version's ranking simple: source metadata pre-score plus LLM relevance score. Avoid complex personalization until the basic loop works smoothly.

## 11. Demo Video Script

Length: 1 to 2 minutes.

Suggested flow:

1. Open Research Radar on Today.
2. Show today's matched item counts and Top Matches.
3. Go to Keywords.
4. Add or enable `LLM Agent`.
5. Select sources: News, Papers, GitHub, Hugging Face, WeChat.
6. Tap refresh.
7. Show Feed sorted by relevance score.
8. Open a high-scoring paper or GitHub item.
9. Show LLM summary, tags, score, and recommendation reason.
10. Save the item.
11. Open Saved and show the item in the reading list.

Key message for narration:
Research Radar helps developers and researchers track fast-moving topics by turning scattered online updates into ranked, summarized, and saved intelligence cards.

## 12. Success Criteria

Product success for course demo:
- The app clearly looks and behaves like a mobile app, not only a static prototype.
- Users can configure at least one keyword.
- The app can fetch real online items from multiple source categories.
- LLM output is visible on content cards or detail pages.
- The demo can show a complete workflow in under two minutes.
- The final project can explain competitor research, design motivation, implementation approach, and team contribution.

Technical success:
- API key is not committed.
- Fetch errors are handled gracefully.
- Unstable sources do not block the whole app.
- The same data model supports all content categories.
- The app can run from the submitted source code with a clear README.
- Today and Feed can show partial results while other sources or LLM analysis are still running.
- Refresh progress is visible per source.
- Cached fallback data is clearly labeled when used.
- Saved items persist across app restart.
- Source fetching, LLM analysis, and UI rendering are separated enough to test independently.

## 13. Software Testing Notes - 2026-07-13

Tester role:
From a user perspective, with additional checks on interface response speed, UI reasonableness, and alignment with the technical design above.

Test environment:
- Project implementation inspected under `.worktrees/research-radar-app`.
- Commands run: `npm test -- --run` and `npm run build`.
- Local app tested through Vite at `http://127.0.0.1:5175/` because ports 5173 and 5174 were already occupied.
- Browser-tested desktop viewport `1280 x 720` and mobile viewport `390 x 844`.

Verification results:
- Automated tests passed: 4 test files, 16 tests.
- Production build passed.
- Desktop first render reached the Today page in about 0.36 seconds in the local test environment.
- Simulated refresh completed in about 1.6 seconds.
- Save item and reload persistence passed: a saved item still appeared in Saved after page reload.

Issues and user-experience risks:

1. High - The current refresh is simulated and does not fetch real online content.
   - Evidence: README states the first implementation uses deterministic demo data and a simulated refresh service. Code inspection shows `runDemoRefresh` recreates local demo items instead of calling arXiv, GitHub, RSS/news, Hugging Face, or an LLM/backend API.
   - User impact: The app looks functional, but users cannot trust it as a real research radar. It also does not meet the design requirement of real fetching for at least three stable source categories.
   - Suggested fix: Implement real adapters for at least arXiv, GitHub, and RSS/news, with clear fallback to cached demo data only when a live source fails.

2. High - Adding a new keyword does not change fetched or ranked results.
   - Reproduction: Add `quantum agents` in Keywords, then tap Refresh on Today.
   - Actual result: The active keyword chip appears, but Top Matches still only contain default `LLM Agent`, `RAG`, and `Diffusion` items.
   - Expected result: Refresh should fetch or generate results related to the new keyword, or show a clear empty/partial state for that keyword.
   - User impact: Users may feel their configuration was ignored, which weakens the core product loop.

3. High - LLM gateway status is not actually validated.
   - Evidence: Settings only displays `OPENAI_API_KEY` and `OPENAI_BASE_URL=https://gmncode.cn/v1`; there is no visible connected/missing/error state.
   - User impact: If the API key is missing or invalid, users only discover the problem indirectly when analysis does not work. This conflicts with the acceptance item that the app should open safely when the API key is missing and show a configuration error before refresh.
   - Suggested fix: Add a real configuration check and show `configured`, `missing key`, `invalid base URL`, or `last check failed` in Settings.

4. Medium - Today source status is too vague.
   - Evidence: Today shows source names such as Technology News, Academic Papers, GitHub, Hugging Face, and Machine Heart / WeChat, but not their status text, update time, or cached/failed state in the visible strip.
   - User impact: Users cannot quickly tell which source is live, cached, failed, or still analyzing. This reduces trust during demos and weakens partial-success handling.
   - Suggested fix: Surface status labels such as `updated`, `cached demo`, `failed`, `analyzing`, and last refresh time directly on Today.

5. Medium - Source badge tap-to-filter behavior from the design is missing.
   - Reproduction: In Feed, inspect or try to interact with a card source badge.
   - Actual result: Source badges are static text spans.
   - Expected result: Tapping a source badge should filter Feed by that source, as described in the design.
   - User impact: Users lose a natural shortcut and must use the top segmented control instead.

6. Medium - Keyword management is incomplete.
   - Evidence: Keywords page supports adding a keyword, but there is no enable/pause switch, no per-keyword source selector editing, no delete action, and no accept/ignore interaction for related-term suggestions.
   - User impact: Users can add topics but cannot properly manage them, so the page feels more like a static list than a configuration center.
   - Suggested fix: Add per-keyword controls for enable/pause, source selection, suggestion acceptance, and removal.

7. Medium - Clear feed cache has no confirmation or success feedback.
   - Reproduction: Open Settings and tap Clear feed cache.
   - Actual result: Feed data is removed except saved items, but there is no confirmation dialog, toast, or visible completion message.
   - User impact: Users may tap it accidentally or not understand what changed.
   - Suggested fix: Add a confirmation step and a short success message, while keeping saved items protected.

8. Medium - Mobile source tabs have limited discoverability.
   - Evidence: On a `390 x 844` viewport, Feed source tabs are horizontally scrollable. `Hugging Face` and `WeChat` start off-screen, while the page itself has no horizontal overflow.
   - User impact: Some users may not realize additional source filters exist.
   - Suggested fix: Add a subtle fade/scroll hint, use shorter labels on mobile, or allow the segmented control to wrap into two rows.

9. Low - Language and formatting consistency should be clarified.
   - Evidence: The UI is mostly English, while the project folder and Chinese media source imply Chinese users may be part of the demo audience. Detail timestamps use English formatting such as `Jul 13, 10:30 AM`.
   - User impact: Not a blocker, but mixed expectations can make the product feel less polished.
   - Suggested fix: Decide whether the demo UI is English-only or bilingual, then apply consistent copy and date formatting.

10. Low - Feed search has no clear button.
    - Evidence: Searching works and keyboard deletion restores the full list, but there is no one-tap clear affordance.
    - User impact: On mobile, clearing a query requires manual text deletion, which is slower during a demo.
    - Suggested fix: Add a small clear icon inside the search field when a query is present.

Additional test coverage suggestions:
- Add integration tests that prove a newly added keyword affects refresh results or produces a keyword-specific empty state.
- Add tests for missing or invalid LLM configuration.
- Add UI tests for source-level failed, cached, analyzing, and partial-success states.
- Add mobile layout regression tests for bottom navigation and Feed source tabs.

## 14. Phase 2 Goals

Phase 2 turns the first interactive demo into a more credible research and developer productivity app. The goal is not to add many new pages, but to make the existing product loop real, responsive, and trustworthy:

```text
configure keywords -> fetch real content -> analyze with LLM -> rank results -> inspect details -> save useful items
```

### 14.1 Phase 2 Priority Levels

Priority 0: product must work as promised.
- Real online fetching for stable source categories.
- Newly added keywords must affect refresh results.
- LLM gateway status must be validated and visible.
- Today must show source-level progress, success, cached fallback, and failure states.

Priority 1: configuration and demo trust.
- Keyword management must support basic editing and control.
- Settings destructive actions must provide confirmation and feedback.
- Partial-success behavior must be visible and testable.

Priority 2: polish and mobile usability.
- Feed source badges should support quick filtering.
- Mobile source tabs should be easier to discover.
- UI language, date formatting, and search clearing should be consistent.

### 14.2 Real Online Fetching

Problem:
The current refresh flow uses deterministic demo data, so it does not yet prove that Research Radar can pull real technology and research updates from the internet.

Phase 2 target:
Implement real source adapters for at least three stable categories:
- arXiv for academic papers.
- GitHub Search or Trending-derived repository data for developer projects.
- RSS or public web feeds for technology news.

Enhanced source targets:
- Hugging Face papers, models, or public pages.
- Machine Heart or WeChat-related content when accessible.

Design requirements:
- Each source adapter must return normalized items matching the unified data model.
- Source failures must not block other sources.
- Cached fallback data is allowed only when clearly labeled as cached or demo fallback.
- Refresh should show per-source progress instead of one vague loading state.

Acceptance criteria:
- Refresh with a keyword such as `LLM Agent` returns live or recently fetched items from at least three stable source categories.
- If one source fails, other source results still render.
- Today and Settings both show whether each source is `updated`, `cached`, `failed`, or `analyzing`.
- The README explains which sources are live and which sources use fallback behavior.

### 14.3 Keyword-Driven Results

Problem:
Adding a keyword currently changes the keyword chip but does not change fetched or ranked content.

Phase 2 target:
Keywords must become real inputs to fetching, matching, and LLM relevance scoring.

Design requirements:
- Refresh should use all enabled keywords.
- Each result should record its matched keyword.
- If a keyword returns no result, the app should show a keyword-specific empty or partial state.
- Default demo keywords can still exist, but they must not override newly added user keywords.

Acceptance criteria:
- Adding `quantum agents` and refreshing either returns content related to that keyword or shows a clear no-results state for that keyword.
- Top Matches and Feed update after keyword changes.
- Tests verify that a new keyword affects refresh behavior.

### 14.4 LLM Gateway Validation

Problem:
The Settings page displays environment variable names but does not validate whether the LLM gateway can actually be used.

Phase 2 target:
Settings should provide a visible LLM configuration state before refresh.

Design requirements:
- The app should detect missing API key configuration.
- The app should detect an invalid or missing base URL.
- The app should expose a lightweight connection check.
- The app should distinguish `configured`, `missing key`, `invalid base URL`, and `last check failed`.
- The app must still open safely when LLM configuration is missing.

Security requirements:
- The API key must never be committed.
- The API key should come from environment variables or an ignored local `.env` file.
- The UI should not print the full secret value.

Acceptance criteria:
- With no API key, Settings shows a missing-key state and refresh explains that LLM analysis cannot run.
- With a configured gateway, Settings shows a connected or configured state.
- Failed LLM analysis does not erase fetched source results.
- Tests cover missing and invalid LLM configuration.

### 14.5 Today Source Status

Problem:
Today shows source names but not enough operational status for users to trust the result.

Phase 2 target:
Today should show source health and freshness directly.

Design requirements:
- Each source should expose a status label:
  - `updated`
  - `fetching`
  - `analyzing`
  - `cached`
  - `failed`
  - `disabled`
- Each source should show last updated time when available.
- Failed sources should include a short reason in Settings or a detail tooltip/sheet.

Acceptance criteria:
- During refresh, users can see which sources are still running.
- After refresh, users can see which sources produced live results and which used fallback data.
- If WeChat or Machine Heart fails, Today still shows other successful source results.

### 14.6 Source Badge Filtering

Problem:
Feed source badges are currently static, although the design describes them as a shortcut for filtering.

Phase 2 target:
Make source badges on content cards interactive.

Design requirements:
- Tapping a source badge in Feed should apply the corresponding source filter.
- The active filter should be visible in the Feed segmented control.
- Users should be able to return to `All`.

Acceptance criteria:
- Tapping a `GitHub` badge filters Feed to GitHub items.
- Tapping `All` restores the full feed.
- The interaction works on desktop and mobile viewports.

### 14.7 Keyword Management

Problem:
The Keywords page currently supports adding topics but not enough management controls.

Phase 2 target:
Turn Keywords into a useful configuration center.

Design requirements:
- Users can enable or pause each keyword.
- Users can delete a keyword.
- Users can choose source categories per keyword.
- Users can accept or ignore LLM related-term suggestions.
- Accepted related terms should be used as matching hints.

Suggested demo-friendly implementation:
- Use compact keyword cards.
- Put source selectors inside each card or a bottom sheet.
- Make related-term suggestions clickable chips.

Acceptance criteria:
- Paused keywords do not participate in refresh.
- Deleted keywords disappear from Today chips and future refreshes.
- Per-keyword source selections affect which adapters run.
- Suggested terms can be accepted or ignored.

### 14.8 Clear Cache Feedback

Problem:
Clear feed cache currently has no confirmation or success feedback.

Phase 2 target:
Make destructive or confusing Settings actions explicit.

Design requirements:
- Add a confirmation step before clearing feed cache.
- Preserve saved items unless the action explicitly says otherwise.
- Show a success message after clearing.

Acceptance criteria:
- Tapping Clear feed cache asks for confirmation.
- Cancel leaves feed data unchanged.
- Confirm clears feed/cache data and shows a success message.
- Saved items remain available.

### 14.9 Mobile Source Tabs

Problem:
On narrow mobile viewports, some source filters start off-screen and may be missed.

Phase 2 target:
Improve source filter discoverability on mobile.

Design options:
- Use shorter labels: `All`, `News`, `Paper`, `GitHub`, `HF`, `WeChat`.
- Allow source filters to wrap into two rows.
- Add a subtle scroll hint or fade if horizontal scrolling remains.

Recommended direction:
Use shorter labels first, then wrap if needed. This is more reliable for a course demo than relying only on a scroll hint.

Acceptance criteria:
- On a `390 x 844` viewport, users can discover all source filters without guessing.
- The page has no accidental horizontal overflow.
- Bottom navigation remains visible and usable.

### 14.10 Language and Formatting Consistency

Problem:
The app mixes English technical content with Chinese project context and Chinese media sources.

Phase 2 target:
Define a consistent demo language policy.

Recommended policy:
- Use English for the app UI, because most source content, papers, GitHub repositories, and Hugging Face pages are English.
- Use Chinese for course presentation narration and documentation when needed.
- Use neutral numeric date formatting, such as `2026-07-13 10:30`, to avoid locale mismatch.

Acceptance criteria:
- Navigation labels, buttons, empty states, and status labels follow one language style.
- Dates and times use one consistent format across Today, Feed, Detail, and Saved.
- Chinese source names such as Machine Heart can remain as source names.

### 14.11 Feed Search Clear Action

Problem:
Feed search works, but mobile users must manually delete text to reset the result list.

Phase 2 target:
Add a one-tap clear affordance.

Design requirements:
- Show a clear icon inside the search input when the query is non-empty.
- Tapping the clear icon resets the query and restores the previous filter state.
- The icon should have an accessible label.

Acceptance criteria:
- Search text can be cleared in one tap.
- Clearing search does not reset the selected source filter unless explicitly intended.

### 14.12 Phase 2 Test Plan

Required tests:
- Integration test: newly added keyword changes refresh output or produces a keyword-specific empty state.
- Integration test: paused keyword is not used during refresh.
- Integration test: per-keyword source selection affects the adapters used.
- Configuration test: missing LLM key shows a visible error and does not crash the app.
- Configuration test: failed LLM request keeps fetched source results visible.
- UI test: source status can show `fetching`, `updated`, `cached`, `failed`, and `analyzing`.
- UI test: source badge tap filters Feed.
- UI test: clear cache confirmation preserves saved items.
- Mobile layout test: Feed source filters and bottom navigation are usable at `390 x 844`.
- UI test: search clear button resets the query.

Manual demo checks:
- Run the app with real API configuration.
- Run the app without API key and verify graceful behavior.
- Refresh with a default keyword and a newly added keyword.
- Simulate one failed source and verify partial results.
- Save an item, reload the app, and verify persistence.

### 14.13 Phase 2 Completion Criteria

Phase 2 is complete when:
- Research Radar fetches live or recently fetched content from at least three stable online source categories.
- User keywords materially affect the result set.
- LLM analysis runs through the configured gateway when available.
- Missing or failed LLM configuration is visible and non-fatal.
- Source status is visible on Today and Settings.
- Keyword management supports enable or pause, delete, and source selection.
- Saved items remain persistent across reloads.
- The app passes automated tests and a mobile viewport smoke test.

## 15. Retest Notes After Fixes - 2026-07-13

Retest scope:
The app was retested after the live refresh/source adapter changes. The same user-facing areas were checked again: automatic tests, build, Today refresh, Feed, Keywords, Settings, cache clearing, and mobile layout.

Retest environment:
- Implementation retested under `.worktrees/research-radar-app`.
- Commands run: `npm test -- --run` and `npm run build`.
- Local app tested through Vite at `http://127.0.0.1:5175/`.
- Browser-tested desktop viewport `1280 x 720` and mobile viewport `390 x 844`.

Retest verification results:
- Automated tests passed: 7 test files, 25 tests.
- Production build passed.
- Live refresh completed in about 3.4 seconds in the browser test.
- Feed showed live-looking results from Hacker News and GitHub after refresh.
- Settings showed source-level partial success/failure messages after refresh.
- Mobile layout still had no whole-page horizontal overflow.

Improved or fixed:

1. Improved - Refresh is no longer purely static demo data.
   - Evidence: After tapping Refresh, Feed contained live source-style results such as Hacker News items and GitHub repositories.
   - Remaining risk: The README still says the first implementation uses deterministic demo data and simulated refresh service, which is now misleading and should be updated.

2. Improved - Source health is more observable in Settings.
   - Evidence: Settings showed messages such as `Hacker News returned 3 items`, `GitHub returned 8 items`, `arXiv fetch failed: Failed to fetch`, and cached labels for Hugging Face and WeChat.
   - Remaining risk: Today still only shows source names in the source strip, so users cannot see fetched/failed/cached status from the landing page.

3. Improved - Partial success behavior is visible.
   - Evidence: The app continued showing results when arXiv failed and cached sources were used.
   - Remaining risk: In the browser retest, only Hacker News and GitHub succeeded as live sources. arXiv failed, while Hugging Face and WeChat were cached, so the tested app still did not successfully fetch three real source categories.

Issues still present:

1. High - New or later enabled keywords still do not drive refresh results.
   - Reproduction: Keep `LLM Agent`, `RAG`, `Diffusion`, and newly added `quantum agents` enabled, then tap Refresh.
   - Actual result: Top Matches after refresh were all matched to `LLM Agent`.
   - Root cause from code inspection: `runLiveRefresh` picks only `state.keywords.find((keyword) => keyword.enabled)`, which returns the first enabled keyword, instead of iterating all enabled keywords or the newly added keyword.
   - User impact: Users can add keywords, but refresh still behaves as if only the first default keyword matters.

2. High - arXiv live source failed in browser testing.
   - Evidence: Settings showed `Academic Papers arXiv fetch failed: Failed to fetch`.
   - User impact: Papers are a core source for the product. If arXiv commonly fails in the browser environment, users lose one of the most important categories.
   - Suggested fix: Add a backend/proxy route for arXiv or another browser-safe fetch path, then keep the source-level fallback visible.

3. Medium - LLM gateway status is still not actually validated.
   - Evidence: Settings still only displays `OPENAI_API_KEY` and `OPENAI_BASE_URL=https://gmncode.cn/v1`, with no configured/missing/invalid state.
   - User impact: Users cannot know whether LLM analysis is configured before refreshing.

4. Medium - Source badge tap-to-filter behavior is still missing.
   - Evidence: Feed source badges are still rendered as non-interactive `span` elements with no role or tabindex.
   - User impact: The card-level filtering shortcut described in the design is still unavailable.

5. Medium - Keyword management is still incomplete.
   - Evidence: Keywords still has only one input and an Add keyword button. No enable/pause switch, source selector, delete action, or accept/ignore controls for suggestions were present.
   - User impact: Users cannot manage keyword subscriptions beyond adding more rows.

6. Medium - Clear feed cache still has no confirmation or success feedback.
   - Evidence: Clicking Clear feed cache produced no JavaScript dialog, no in-page dialog, and no alert/toast/status message.
   - User impact: Users may not understand what changed or may clear data accidentally.

7. Medium - Mobile source tabs still have limited discoverability.
   - Evidence: On a `390 x 844` viewport, `Hugging Face` and `WeChat` started outside the visible segmented-control area, although the page itself had no horizontal overflow.
   - User impact: Mobile users may not realize more source filters are available.

8. Low - README is outdated after the live refresh changes.
   - Evidence: README still says the first implementation uses deterministic demo data and a simulated refresh service.
   - User impact: A grader or teammate may misunderstand the current implementation and test the wrong expectations.

Updated test coverage suggestions:
- Add a test for refreshing across all enabled keywords, including a keyword added by the user.
- Add a browser or integration test that exercises arXiv failure and verifies a clear fallback state.
- Add an assertion that README/data notes match the current live-refresh implementation.
- Add UI tests for source badge filtering, keyword enable/pause/source editing, and cache clear confirmation.

## 16. Phase 2 Retest Action Plan

The second retest shows that the app is moving from static demo data toward a live research radar, but the core product loop is not fully complete yet. The next work should focus on closing the gap between "live-looking refresh" and "user-controlled multi-source research intelligence."

### 16.1 Retest Summary

Confirmed improvements:
- Refresh is no longer purely static demo data.
- Hacker News and GitHub produced live source-style results in the browser test.
- Settings now exposes source-level partial success and failure messages.
- The app continues working when one source fails.
- Mobile layout avoids whole-page horizontal overflow.
- Automated coverage increased from 4 test files and 16 tests to 7 test files and 25 tests.

Main remaining risks:
- Refresh still uses only the first enabled keyword, so user-added keywords do not materially affect results.
- arXiv failed in the browser test, which weakens the academic-paper pillar of the product.
- LLM gateway status is still not validated before refresh.
- Several Phase 2 UX items remain incomplete: source badge filtering, keyword management, cache-clear feedback, and mobile source tab discoverability.
- README is outdated and now conflicts with the implemented live-refresh behavior.

### 16.2 Priority 0: Refresh Across All Enabled Keywords

Problem:
The retest found that `runLiveRefresh` uses only the first enabled keyword. This means default keywords can overshadow user-added topics such as `quantum agents`.

Decision:
This remains the highest-priority issue because keyword-driven discovery is the central product promise.

Target behavior:
- Refresh should collect all enabled keywords.
- Source adapters should receive either all enabled keywords or run once per enabled keyword.
- Each returned item should record the keyword that matched it.
- Ranking should consider relevance across all enabled keywords.
- Top Matches should not be dominated by the first default keyword unless it truly has the best results.

Recommended implementation direction:
- Replace single-keyword lookup with an enabled-keyword array.
- For each source, fetch against all enabled keywords with a reasonable concurrency limit.
- Deduplicate results after fetching.
- Preserve `matchedKeyword` and optionally `matchedTerms` on each normalized item.
- If a user-added keyword returns no result, show a keyword-specific empty or partial status.

Acceptance criteria:
- Adding `quantum agents` and refreshing produces results matched to `quantum agents` or a clear no-results status for that keyword.
- Top Matches can include more than one enabled keyword.
- Tests cover refresh with default keywords plus a newly added keyword.

### 16.3 Priority 0: Browser-Safe Academic Paper Source

Problem:
arXiv failed during browser testing with `Failed to fetch`. Academic papers are a core source category, so this cannot remain unreliable in the main demo path.

Decision:
Keep arXiv as the preferred academic source, but add a browser-safe path or fallback so Papers remains credible during demo.

Target behavior:
- Academic Papers source should try live fetch first.
- If direct browser fetch fails, the app should use a backend/proxy route or a known browser-safe paper source.
- If all live paper fetch paths fail, cached fallback should be clearly labeled.

Recommended implementation options:
- Add a small backend/proxy route for arXiv requests.
- Use a serverless endpoint or local development proxy for the course demo.
- Add a secondary academic source if arXiv is blocked in the browser environment.

Acceptance criteria:
- Papers source can return live paper-like results in the standard demo environment.
- If arXiv fails, Today and Settings show `failed` or `cached` without breaking Feed.
- A browser/integration test covers arXiv failure and visible fallback.

### 16.4 Priority 0: LLM Gateway Status Validation

Problem:
The retest confirms that Settings still shows only configuration names, not whether the LLM gateway is usable.

Decision:
This should be completed before demo rehearsal because the app depends on LLM summaries, tags, scores, and reasons.

Target behavior:
- Settings should show one of these states:
  - `configured`
  - `missing key`
  - `invalid base URL`
  - `last check failed`
  - `connected`
- Refresh should warn users when LLM analysis cannot run.
- Fetched source results should remain visible even if LLM analysis fails.

Recommended implementation direction:
- Add a lightweight LLM health check.
- Do not expose the full API key in UI or logs.
- Store only a generic redacted status such as `configured key present` if a visible hint is needed.
- Keep the app usable without LLM configuration.

Acceptance criteria:
- Running without an API key shows `missing key`.
- Running with a configured gateway shows a positive status after check.
- LLM request failure shows a visible non-fatal error.
- Tests cover missing and failed LLM configuration.

### 16.5 Priority 1: Source Health on Today

Problem:
Settings shows source-level status, but Today still does not expose enough source health information from the landing page.

Decision:
This should be included because Today is the demo opening screen.

Target behavior:
- Today source strip should show status labels for each source.
- Status labels should distinguish live, cached, failed, fetching, and analyzing.
- Last updated time should be visible or available in a compact detail view.

Acceptance criteria:
- After refresh, Today makes it clear that Hacker News and GitHub succeeded, arXiv failed, and Hugging Face or WeChat used cached data if that is the actual state.
- Users can understand partial success without opening Settings.

### 16.6 Priority 1: README and Data Notes Update

Problem:
README still describes deterministic demo data and simulated refresh even after live-refresh changes.

Decision:
This should be fixed soon because graders and teammates may rely on README to understand the current implementation.

Target behavior:
- README should accurately describe which sources are live.
- README should describe which sources are cached or fallback.
- README should explain required environment variables for LLM analysis.
- README should include troubleshooting notes for source failures.

Acceptance criteria:
- README no longer says refresh is only simulated if live fetching is implemented.
- README explains how to run, configure, refresh, and interpret source statuses.
- A documentation check or test assertion prevents stale data-source notes from drifting again.

### 16.7 Priority 2: Remaining Interaction Polish

The following items are still useful, but they should come after the three core blockers above:

Source badge filtering:
- Make Feed source badges interactive.
- Ensure tapping a badge updates the active Feed source filter.
- Add keyboard accessibility if badges are implemented as buttons.

Keyword management:
- Add enable or pause controls.
- Add delete action.
- Add per-keyword source selection.
- Add accept or ignore controls for related-term suggestions.

Cache clearing:
- Add confirmation before clearing.
- Show success feedback after clearing.
- Preserve saved items.

Mobile source tabs:
- Use shorter labels such as `HF`.
- Ensure all filters are discoverable at `390 x 844`.
- Avoid whole-page horizontal overflow.

### 16.8 Retest-Derived Test Plan

New required tests:
- Refresh uses all enabled keywords, including one added by the user.
- Results preserve `matchedKeyword` for each item.
- Top Matches can include results from multiple keywords.
- arXiv failure produces a visible failed or cached state without breaking Feed.
- README/data-source notes match current refresh mode.
- LLM missing-key state is visible and non-fatal.
- LLM failed-check state is visible and non-fatal.

Carry-over tests from Phase 2:
- Source badge filtering.
- Keyword enable, pause, delete, and source editing.
- Cache clear confirmation and saved-item preservation.
- Mobile source filter discoverability.

### 16.9 Updated Completion Criteria Before Demo

Before recording the final demo video, the app should satisfy these checks:
- Refresh uses all enabled keywords, not just the first enabled keyword.
- At least three source categories are live or have clearly labeled fallback behavior.
- Academic Papers has a reliable demo path, either direct arXiv, proxy arXiv, or another paper source.
- LLM gateway status is visible before refresh.
- Today shows source-level success, failed, cached, or analyzing states.
- README matches the current implementation.
- The app still passes automated tests and production build.

## 17. Retest Notes After P0/P1 Core Implementation - 2026-07-13

Retest scope:
The P0/P1 core loop was retested after the latest development changes. The check focused on multi-keyword refresh, academic-paper fallback, LLM configuration status, Today source status, README accuracy, automated tests, build, and mobile layout sanity.

Retest environment:
- Implementation retested under `.worktrees/research-radar-app`.
- Current app branch head during retest: `c91e1e2 feat: surface refresh status docs`.
- Commands run: `npm test -- --run` and `npm run build`.
- Local app tested through Vite at `http://127.0.0.1:5175/`.
- Browser-tested desktop viewport `1280 x 720` and mobile viewport `390 x 844`.

Verification results:
- Automated tests passed: 9 test files, 32 tests.
- Production build passed.
- Refresh completed in about 4.0 seconds in the browser test.
- Feed contained 51 cards after refresh.
- Feed results covered all enabled keywords in local state: `LLM Agent`, `RAG`, `Diffusion`, `quantum agents`, and `robotics agents`.
- Searching `robotics` returned 8 cards, all matched to `robotics agents`.
- Today now shows source status and last updated information instead of source names only.
- Settings shows LLM missing-key status without exposing an API key.
- README now describes live refresh, source fallback, and `VITE_OPENAI_*` configuration accurately.

What is now reasonable:

1. P0 multi-keyword refresh is functionally working.
   - Evidence: Feed distribution after refresh included multiple matched keywords rather than only the first enabled keyword.
   - User impact: A newly added keyword can now produce visible results in Feed.

2. Academic Papers has a safer demo path.
   - Evidence: When arXiv did not return live browser results, Today and Settings showed Academic Papers as cached/fallback instead of silently losing the source.
   - User impact: The demo no longer breaks the paper category when direct arXiv fetch is unreliable.

3. LLM missing-key state is visible and non-fatal.
   - Evidence: Settings showed `Missing API key`, guidance to set `VITE_OPENAI_API_KEY`, and a `missing-key` status while Feed/Today still worked.
   - User impact: Users understand why gateway analysis is unavailable without the app crashing.

4. Today source visibility is much better.
   - Evidence: Today displayed source names plus updated time and statuses such as `fetched`, `cached`, or `failed`.
   - User impact: Users can understand partial success from the opening screen.

Remaining issues and reasonableness risks:

1. Medium - Top Matches are still dominated by the first keyword when many items tie at the same score.
   - Reproduction: With `LLM Agent`, `RAG`, `Diffusion`, `quantum agents`, and `robotics agents` enabled, refresh and inspect Today.
   - Actual result: Feed contains all keywords, but Top Matches showed five `LLM Agent` cards because many items had the same score.
   - User impact: The core data path works, but the Today page can still make users think only the first keyword matters.
   - Suggested fix: Add a small diversity rule for Today Top Matches, such as limiting the first pass to one or two cards per matched keyword before filling remaining slots by score.

2. Medium - LLM status is configuration validation, not a live connection check.
   - Evidence: `getLlmConfigStatus` returns `missing-key`, `invalid-base-url`, or `configured`; it does not perform a lightweight request or expose `connected` / `last check failed`.
   - User impact: A configured but unreachable gateway can still look healthy until a real request fails.
   - Suggested fix: Add an optional Check Gateway action or refresh-time health check that can set `connected` or `last check failed` without exposing secrets.

3. Low - Mobile layout still has slight horizontal overflow and source tabs remain partly hidden.
   - Evidence: On `390 x 844`, measured document width was `392`, about 2px wider than the viewport. `Hugging Face` and `WeChat` still start outside the visible source-tab area.
   - User impact: Not a core P0/P1 blocker, but mobile polish remains incomplete.
   - Suggested fix: Shorten labels on mobile, wrap source filters, or constrain the segmented control width more tightly.

4. Low - P2 interactions remain out of scope and still incomplete.
   - Evidence: This retest did not find completed source badge filtering, keyword enable/delete/source editing, or clear-cache confirmation.
   - User impact: The P0/P1 core is now much stronger, but the app is not yet fully aligned with every Phase 2 UX item.

Overall judgment:
The P0/P1 core implementation is broadly reasonable for the current stage. The main product loop now behaves much closer to the design: multi-keyword refresh works, source fallback is visible, LLM missing configuration is understandable, Today is more transparent, and README is no longer stale. Before a polished final demo, the highest-value next fix is Top Matches diversity, because Feed proves multi-keyword results exist but Today can still visually hide that fact.

## 18. PM Assessment and Phase 3 Goals After Third Retest

The third retest changes the product status from "core loop still questionable" to "core loop broadly credible, with presentation and trust gaps remaining." From a product management perspective, Phase 3 should not expand the app into new major features. It should make the existing demo more convincing, easier to explain, and harder to misread.

### 18.1 PM Judgment

What is now acceptable for the course project:
- Multi-keyword refresh works in Feed.
- User-added keywords can produce visible results.
- Academic Papers has a safe fallback path when arXiv fails.
- Missing LLM configuration is visible and non-fatal.
- Today shows source status and update information.
- README now matches the live-refresh direction.
- Automated tests and production build pass.

What is still risky for final presentation:
- Today Top Matches can visually overrepresent the first keyword even when Feed contains diverse keyword results.
- LLM status validates configuration shape but does not prove the gateway is reachable.
- Mobile source filters still have minor discoverability and overflow issues.
- P2 interactions remain unfinished, but most of them are not required for a convincing final demo.

PM conclusion:
The next phase should prioritize perception alignment. The app is doing more of the right work internally, but Today must show that clearly. The product should avoid adding unrelated features until Top Matches, gateway trust, and mobile polish are settled.

### 18.2 Phase 3 Priority Levels

Priority 0: final-demo clarity.
- Improve Today Top Matches diversity so multiple enabled keywords are visible.
- Ensure the demo script explicitly shows Feed search or filtering proving keyword-specific results.

Priority 1: trust and reliability.
- Add optional LLM gateway live check or refresh-time health result.
- Keep source and LLM failures non-fatal and clearly labeled.

Priority 2: mobile polish and interaction completeness.
- Fix the slight mobile horizontal overflow.
- Improve source filter discoverability on mobile.
- Complete selected P2 interactions only if time remains.

### 18.3 Top Matches Diversity

Problem:
Feed results now cover all enabled keywords, but Today Top Matches can still show only the first keyword when many items share the same score.

PM judgment:
This is the highest-value Phase 3 fix. Today is the first screen in the demo, so it must communicate that Research Radar is multi-keyword and personalized. If Today shows only `LLM Agent`, a grader may assume the keyword fix did not work even though Feed proves it does.

Target behavior:
- Today Top Matches should favor high-scoring items while also representing multiple enabled keywords.
- Diversity should be simple and explainable.
- The algorithm should not hide genuinely high-value items, but it should avoid filling all top slots with one keyword when other enabled keywords have comparable results.

Recommended rule:
- First pass: select up to one or two top cards per matched keyword.
- Second pass: fill remaining slots by global relevance score.
- Keep the list size at 3 to 5 cards for demo readability.

Acceptance criteria:
- With `LLM Agent`, `RAG`, `Diffusion`, `quantum agents`, and `robotics agents` enabled, Today Top Matches includes more than one matched keyword when eligible items exist.
- Feed remains sorted or filterable by relevance without forced diversity.
- The card still shows `matchedKeyword`, summary, source, and relevance score.
- A unit test covers tie-score diversity behavior.

Demo note:
During the final video, show Today first, then use Feed search for `robotics` or another added keyword to prove keyword-specific results exist.

### 18.4 LLM Gateway Live Check

Problem:
Settings can show `configured`, `missing-key`, or `invalid-base-url`, but it does not prove that the gateway is reachable.

PM judgment:
This is useful but should not block the final demo if LLM calls are not the central live action. It matters most when presenting the app as a real productivity tool rather than a static prototype.

Target behavior:
- Provide a lightweight "Check Gateway" action in Settings, or perform a health check during refresh.
- Show `connected` after a successful check.
- Show `last check failed` after a failed check.
- Never reveal the API key.

Recommended scope:
- Add a manual Check Gateway button first.
- Avoid automatic checks on every render to prevent unnecessary API usage.
- If the check endpoint is not guaranteed, use a minimal model-list or lightweight completion request through the configured gateway.

Acceptance criteria:
- Missing key remains visible before any check.
- Configured gateway can be tested explicitly.
- Failed check is shown without clearing fetched source results.
- Test coverage verifies `connected` and `last check failed` states using mocked responses.

### 18.5 Mobile Source Filter Polish

Problem:
Mobile viewport still has about 2px horizontal overflow and some source filters are hidden inside the segmented control.

PM judgment:
This is not a core product blocker, but it affects perceived polish because the final demo is a mobile app project.

Target behavior:
- No whole-page horizontal overflow at `390 x 844`.
- All source filters should be discoverable without guessing.
- Labels should remain readable.

Recommended implementation:
- Use shorter mobile labels:
  - `All`
  - `News`
  - `Paper`
  - `GitHub`
  - `HF`
  - `WeChat`
- Constrain segmented controls to the viewport width.
- Prefer wrapping into two rows over hidden horizontal scrolling if space remains tight.

Acceptance criteria:
- Document width is not greater than viewport width in the mobile smoke test.
- `HF` and `WeChat` are visible or clearly discoverable on first view.
- Bottom navigation remains stable.

### 18.6 P2 Interactions Decision

The third retest notes that source badge filtering, keyword enable/delete/source editing, and clear-cache confirmation are still incomplete.

PM judgment:
These are useful but should not all be treated as final-demo blockers. Their value differs:

Should complete if time allows:
- Clear-cache confirmation and success feedback, because it is low effort and reduces accidental destructive action.
- Source badge filtering, because it is a small interaction that makes Feed feel more polished.

Can defer if schedule is tight:
- Full keyword editing with per-keyword source selectors.
- Accept/ignore controls for related-term suggestions.

Reason:
The final demo can already show keyword addition, refresh, Feed results, Details, and Saved. Full subscription management is a product-depth feature, not required to prove the main loop.

Acceptance criteria if implemented:
- Source badge tap filters Feed.
- Clear feed cache asks for confirmation and preserves saved items.
- Keyword delete or pause works only if the UI clearly communicates the effect.

### 18.7 Phase 3 Test Plan

Required tests:
- Top Matches diversity with tied relevance scores across multiple keywords.
- Top Matches still prefers higher-score items when scores differ clearly.
- LLM gateway check success and failure states with mocked network responses.
- Mobile viewport smoke test confirms no horizontal document overflow.

Recommended tests:
- Source badge filtering, if implemented.
- Clear-cache confirmation and saved-item preservation, if implemented.
- Demo-script smoke test: add keyword, refresh, show Today diversity, search Feed, open Detail, save item.

### 18.8 Updated Final Demo Readiness Criteria

The app is ready for final demo recording when:
- Today Top Matches visibly represents multiple keywords when data exists.
- Feed can prove keyword-specific results through search or filtering.
- Settings clearly distinguishes missing LLM configuration from configured or failed gateway checks.
- Source fallback states remain visible and non-fatal.
- Mobile layout has no obvious horizontal overflow.
- README matches the current behavior.
- Automated tests and production build pass.

Features that may remain out of scope for final demo:
- Full per-keyword source editing.
- Accept/ignore controls for related-term suggestions.
- Production-grade WeChat crawling.
- Full account system, notifications, or cross-device sync.

## 19. Retest Notes After Phase 3 Demo Polish - 2026-07-13

Retest scope:
The app was retested after the latest phase 3 demo polish commits. The check focused on the previously reported remaining issues: Today Top Matches diversity, LLM gateway check, mobile source filter layout, source badge filtering, keyword management, clear-cache feedback, automated tests, and build.

Retest environment:
- Implementation retested under `.worktrees/research-radar-app`.
- Current app branch head during retest: `cc0d386 fix: complete phase 3 demo polish`.
- Commands run: `npm test -- --run` and `npm run build`.
- Local app tested through Vite at `http://127.0.0.1:5175/`.
- Browser-tested desktop viewport `1280 x 720` and mobile viewport `390 x 844`.

Verification results:
- Automated tests passed: 9 test files, 40 tests.
- Production build passed.
- Refresh completed in about 4.7 seconds in the browser test.
- Today Top Matches showed five different matched keywords: `LLM Agent`, `RAG`, `Diffusion`, `quantum agents`, and `robotics agents`.
- Feed contained 52 cards after refresh and covered all enabled keywords.
- Searching `robotics` returned 8 cards, all matched to `robotics agents`.
- Settings showed `Check Gateway` and kept the LLM state as `missing-key` when no API key was configured.
- Mobile Feed source tabs now use shorter labels: `All`, `News`, `Paper`, `GitHub`, `HF`, `WeChat`.
- On mobile, source tabs wrapped into two visible rows, so `HF` and `WeChat` were discoverable without horizontal guessing.

What is now reasonable:

1. Top Matches diversity is fixed for the tested state.
   - Evidence: Today showed one top card per enabled keyword after refresh instead of five `LLM Agent` cards.
   - User impact: The opening screen now communicates that multiple active keywords are actually participating in ranking.

2. LLM gateway check is visible.
   - Evidence: Settings includes a `Check Gateway` button, and clicking it without an API key did not incorrectly report a connected state.
   - User impact: The user has an obvious place to check gateway readiness before demo refresh.

3. Mobile source filter discoverability is much better.
   - Evidence: Source filter labels were shortened and wrapped into two rows on `390 x 844`, with all source filters visible.
   - User impact: Mobile users can discover `HF` and `WeChat` filters without guessing that the control scrolls.

4. Core demo loop remains stable after polish.
   - Evidence: Tests and build passed, refresh still produced multi-keyword results, source health remained visible, and no browser console errors were captured from the app during the refresh check.

Remaining issues and user-experience risks:

1. Medium - Source badge filtering is still not implemented.
   - Evidence: Feed card source badges are still rendered as non-interactive `span` elements with no role or tabindex.
   - User impact: The design says tapping a source badge should filter Feed, but users still must use the segmented control manually.
   - Suggested fix: Render source badges as buttons in Feed cards and wire them to `setFeedFilter({ sourceType })`.

2. Medium - Keyword management is still incomplete.
   - Evidence: Keywords page still has no checkbox, switch, select, delete button, or source-edit controls. It only shows the Add keyword flow and static keyword cards.
   - User impact: Users can add topics but cannot pause, delete, or edit per-keyword source selections from the UI.
   - Suggested fix: Add compact per-keyword controls for enable/pause, delete, and source toggles.

3. Medium - Clear feed cache still has no confirmation or feedback.
   - Evidence: Clicking Clear feed cache produced no JavaScript dialog, no in-page dialog, no alert, and no toast/status message.
   - User impact: Users may not realize feed cache was cleared, and accidental taps are not protected.
   - Suggested fix: Add a confirmation dialog and a short success message after clearing.

4. Low - Mobile layout still has a tiny horizontal overflow.
   - Evidence: On `390 x 844`, measured document width was `392`, about 2px wider than the viewport.
   - User impact: This is minor, but it can create a subtle horizontal jiggle on mobile.
   - Suggested fix: Check container widths, border sizing, and fixed-width frame styles around the app shell and bottom navigation.

Overall judgment:
The latest changes make the P0/P1 core and the most visible demo polish much more reasonable. Today now proves multi-keyword ranking, Settings exposes gateway checking, and mobile source filters are discoverable. The main remaining gaps are P2 interaction features: source badge filtering, keyword management, and clear-cache confirmation.
