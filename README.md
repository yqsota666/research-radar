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
2. Use Feed to filter all normalized cards by source.
3. Open a card detail and save it.
4. Check Saved to confirm the reading list persists locally.
5. Add a keyword in Keywords and review related-term suggestions.
6. Open Settings to view LLM configuration guidance and source health.

## Data and LLM Notes

The first implementation uses deterministic demo data and a simulated refresh service. Stable sources such as arXiv, GitHub, RSS/news, and Hugging Face are represented as fetched. Machine Heart / WeChat is clearly marked as cached demo data because direct crawling can be unstable.

For a live LLM or backend integration, provide credentials outside source control:

```bash
OPENAI_API_KEY=<provided outside source control>
OPENAI_BASE_URL=https://gmncode.cn/v1
```

Do not commit `.env` files or API keys.
