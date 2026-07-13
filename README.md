# Research Radar

Research Radar is a mobile-first demo app for tracking research and developer updates by keyword. It turns multi-source items into ranked cards with summaries, tags, scores, source status, and a saved reading list.

## Run Locally

```bash
npm install
npm run dev
```

The dev server defaults to `http://127.0.0.1:5173`.

## Test and Build

```bash
npm test -- --run
npm run build
```

## Demo Flow

1. Open Today and review active keywords, source status, metrics, and Top Matches.
2. Confirm Top Matches diversity by checking that Today represents multiple keywords when eligible items exist.
3. Use Feed to filter all normalized cards by source with compact mobile-safe source labels.
4. Open a card detail and save it.
5. Check Saved to confirm the reading list persists locally.
6. Add a keyword in Keywords and review related-term suggestions.
7. Open Settings to view LLM configuration guidance, source health, and run Check Gateway manually.

## Live Refresh and LLM Notes

The current implementation uses a multi-keyword live refresh loop. For every enabled keyword, the app calls only the source adapters selected for that keyword, preserves `matchedKeyword`, deduplicates normalized items, and keeps saved items.

Live adapters currently cover:

- GitHub Search for repositories.
- Hacker News Algolia for technology news.
- arXiv for papers.

Because arXiv can fail from browser networking or CORS-like restrictions, the paper adapter includes an arXiv browser-safe fallback. When live paper fetch fails, Papers still shows a cached fallback sample and source status is marked as cached rather than silently disappearing.

Machine Heart / WeChat and Hugging Face remain clearly labeled cached demo sources until their live adapters are enabled.

For a live LLM or backend integration, provide credentials outside source control:

```bash
VITE_OPENAI_API_KEY=<provided outside source control>
VITE_OPENAI_BASE_URL=https://gmncode.cn/v1
```

Settings displays LLM status as missing key, invalid base URL, or configured. It does not display the API key value.

Do not commit `.env` files or API keys.
