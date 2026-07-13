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

Benefits:
- Today and Feed can render all content with one card component.
- Saved can reuse the same item structure.
- LLM output is source-independent.

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

## 10. Demo Video Script

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

## 11. Success Criteria

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
