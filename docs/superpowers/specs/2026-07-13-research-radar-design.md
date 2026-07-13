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
