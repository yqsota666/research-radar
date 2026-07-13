import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Home,
  Loader2,
  Plus,
  Radar,
  RefreshCw,
  Rss,
  Search,
  Settings,
  SlidersHorizontal,
  Tags
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { sourceLabels } from './domain/demoData';
import {
  getTodaySummary,
  getVisibleFeedItems,
  toggleSaved
} from './domain/radar';
import type { AppState, FeedFilter, RadarItem, SourceType } from './domain/types';
import { runLiveRefresh } from './services/liveRefresh';
import {
  checkLlmGateway,
  getLlmConfigStatus,
  type LlmEnv
} from './services/llmConfig';
import { suggestRelatedTerms } from './services/refresh';
import { clearFeedCache, loadState, saveState } from './services/storage';

type Tab = 'today' | 'feed' | 'keywords' | 'saved' | 'settings';

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'keywords', label: 'Keywords', icon: Tags },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const sourceTabs: Array<{ value: FeedFilter['sourceType']; label: string; shortLabel: string }> = [
  { value: 'all', label: 'All', shortLabel: 'All' },
  { value: 'news', label: 'News', shortLabel: 'News' },
  { value: 'paper', label: 'Papers', shortLabel: 'Paper' },
  { value: 'github', label: 'GitHub', shortLabel: 'GitHub' },
  { value: 'huggingface', label: 'Hugging Face', shortLabel: 'HF' },
  { value: 'wechat', label: 'WeChat', shortLabel: 'WeChat' }
];

interface AppProps {
  llmEnv?: LlmEnv;
  gatewayFetcher?: typeof fetch;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function statusTone(status: string): string {
  if (status === 'fetched') return 'ok';
  if (status === 'cached') return 'warn';
  if (status === 'failed') return 'bad';
  return 'idle';
}

function SourceBadge({ sourceType }: { sourceType: SourceType }) {
  return <span className={`source-badge source-${sourceType}`}>{sourceLabels[sourceType]}</span>;
}

function ItemCard({
  item,
  onOpen,
  onToggleSaved
}: {
  item: RadarItem;
  onOpen: (item: RadarItem) => void;
  onToggleSaved: (itemId: string) => void;
}) {
  return (
    <article className="item-card">
      <div className="item-card__top">
        <SourceBadge sourceType={item.sourceType} />
        <strong>{item.relevanceScore}</strong>
      </div>
      <button className="item-title" type="button" onClick={() => onOpen(item)}>
        {item.title}
      </button>
      <p>{item.summary || 'Summary unavailable'}</p>
      <div className="tag-row">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="item-card__footer">
        <span>{item.matchedKeyword}</span>
        {item.isCachedSample ? <span className="cached-label">cached demo</span> : null}
        <button
          aria-label={`${item.saved ? 'Unsave' : 'Save'} ${item.title}`}
          className={item.saved ? 'icon-button saved' : 'icon-button'}
          type="button"
          onClick={() => onToggleSaved(item.id)}
        >
          <Bookmark size={17} />
        </button>
      </div>
    </article>
  );
}

function DetailSheet({
  item,
  onClose,
  onToggleSaved
}: {
  item: RadarItem;
  onClose: () => void;
  onToggleSaved: (itemId: string) => void;
}) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Item detail">
      <div className="sheet__panel">
        <div className="sheet__bar">
          <SourceBadge sourceType={item.sourceType} />
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <h2>{item.title}</h2>
        <p className="muted">
          {item.sourceName} · {formatTime(item.publishedAt)}
        </p>
        <p>{item.summary}</p>
        <section>
          <h3>Recommendation Reason</h3>
          <p>{item.reason}</p>
        </section>
        <div className="tag-row">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="sheet__actions">
          <button type="button" onClick={() => onToggleSaved(item.id)}>
            <Bookmark size={16} />
            {item.saved ? 'Unsave' : 'Save'}
          </button>
          <a href={item.url} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Original
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App({ llmEnv = import.meta.env, gatewayFetcher = fetch }: AppProps = {}) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [llmStatus, setLlmStatus] = useState(() => getLlmConfigStatus(llmEnv));
  const [isCheckingGateway, setIsCheckingGateway] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>({
    sourceType: 'all',
    query: '',
    sortBy: 'relevance'
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const summary = useMemo(() => getTodaySummary(state), [state]);
  const feedItems = useMemo(
    () => getVisibleFeedItems(state.items, feedFilter),
    [state.items, feedFilter]
  );
  const selectedItem = state.items.find((item) => item.id === selectedItemId) ?? null;
  const savedItems = state.items.filter((item) => item.saved);

  useEffect(() => {
    setLlmStatus(getLlmConfigStatus(llmEnv));
  }, [llmEnv]);

  function handleToggleSaved(itemId: string) {
    setState((current) => ({ ...current, items: toggleSaved(current.items, itemId) }));
  }

  async function handleRefresh() {
    setState((current) => ({ ...current, isRefreshing: true }));
    const refreshed = await runLiveRefresh(state);
    setState(refreshed);
  }

  function handleAddKeyword() {
    const term = newKeyword.trim();
    if (!term) return;
    setState((current) => ({
      ...current,
      keywords: [
        ...current.keywords,
        {
          id: `keyword-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          term,
          enabled: true,
          sources: ['paper', 'github', 'news'],
          relatedTerms: suggestRelatedTerms(term)
        }
      ]
    }));
    setNewKeyword('');
  }

  async function handleCheckGateway() {
    setIsCheckingGateway(true);
    const nextStatus = await checkLlmGateway(llmEnv, gatewayFetcher);
    setLlmStatus(nextStatus);
    setIsCheckingGateway(false);
  }

  function renderToday() {
    return (
      <section className="page-panel">
        <div className="hero">
          <div>
            <span className="eyebrow">Mobile intelligence radar</span>
            <h1>Research Radar</h1>
            <p>Ranked research, repositories, models, and AI media for your active topics.</p>
          </div>
          <button
            className="primary-action"
            type="button"
            disabled={state.isRefreshing}
            onClick={handleRefresh}
          >
            {state.isRefreshing ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
            Refresh
          </button>
        </div>

        <div className="keyword-row">
          {state.keywords
            .filter((keyword) => keyword.enabled)
            .map((keyword) => (
              <span key={keyword.id}>{keyword.term}</span>
            ))}
        </div>

        <div className="metric-grid">
          <div>
            <span>Total</span>
            <strong>{summary.totalItems}</strong>
          </div>
          <div>
            <span>Papers</span>
            <strong>{summary.counts.paper}</strong>
          </div>
          <div>
            <span>GitHub</span>
            <strong>{summary.counts.github}</strong>
          </div>
          <div>
            <span>News</span>
            <strong>{summary.counts.news}</strong>
          </div>
        </div>

        <section className="source-strip" aria-label="Source status">
          {Object.values(state.sourceStatuses).map((source) => (
            <div key={source.sourceType} className={`source-status ${statusTone(source.status)}`}>
              <CheckCircle2 size={16} />
              <div>
                <strong>{source.label}</strong>
                <span>Updated {formatTime(source.lastFetchedAt ?? state.lastUpdatedAt)}</span>
              </div>
              <span className={`pill ${statusTone(source.status)}`}>{source.status}</span>
            </div>
          ))}
        </section>

        <h2>Top Matches</h2>
        <div className="card-list">
          {summary.topMatches.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onOpen={(nextItem) => setSelectedItemId(nextItem.id)}
              onToggleSaved={handleToggleSaved}
            />
          ))}
        </div>
      </section>
    );
  }

  function renderFeed() {
    return (
      <section className="page-panel">
        <div className="page-title">
          <h1>Unified Feed</h1>
          <SlidersHorizontal size={20} />
        </div>
        <label className="search-box">
          <Search size={17} />
          <input
            value={feedFilter.query}
            placeholder="Search local cards"
            onChange={(event) =>
              setFeedFilter((current) => ({ ...current, query: event.target.value }))
            }
          />
        </label>
        <div className="segmented">
          {sourceTabs.map((tab) => (
            <button
              key={tab.value}
              aria-label={tab.label}
              className={feedFilter.sourceType === tab.value ? 'active' : ''}
              type="button"
              onClick={() => setFeedFilter((current) => ({ ...current, sourceType: tab.value }))}
            >
              {tab.shortLabel}
            </button>
          ))}
        </div>
        <select
          aria-label="Sort feed"
          value={feedFilter.sortBy}
          onChange={(event) =>
            setFeedFilter((current) => ({
              ...current,
              sortBy: event.target.value as FeedFilter['sortBy']
            }))
          }
        >
          <option value="relevance">Relevance score</option>
          <option value="publishedAt">Publish time</option>
          <option value="sourceType">Source type</option>
        </select>
        <div className="card-list">
          {feedItems.length === 0 ? (
            <p className="empty">No matching results.</p>
          ) : (
            feedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOpen={(nextItem) => setSelectedItemId(nextItem.id)}
                onToggleSaved={handleToggleSaved}
              />
            ))
          )}
        </div>
      </section>
    );
  }

  function renderKeywords() {
    return (
      <section className="page-panel">
        <div className="page-title">
          <h1>Keywords</h1>
          <Radar size={21} />
        </div>
        <div className="add-keyword">
          <label>
            New keyword
            <input
              aria-label="New keyword"
              value={newKeyword}
              onChange={(event) => setNewKeyword(event.target.value)}
            />
          </label>
          <button type="button" onClick={handleAddKeyword}>
            <Plus size={16} />
            Add keyword
          </button>
        </div>
        <div className="keyword-list">
          {state.keywords.map((keyword) => (
            <article key={keyword.id}>
              <div>
                <strong>{keyword.term}</strong>
                <span>{keyword.enabled ? 'enabled' : 'paused'}</span>
              </div>
              <p>{keyword.relatedTerms.join(' · ')}</p>
              <div className="tag-row">
                {keyword.sources.map((source) => (
                  <span key={source}>{sourceLabels[source]}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderSaved() {
    return (
      <section className="page-panel">
        <div className="page-title">
          <h1>Saved Reading List</h1>
          <BookOpen size={21} />
        </div>
        <div className="card-list">
          {savedItems.length === 0 ? (
            <p className="empty">Saved items will appear here.</p>
          ) : (
            savedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOpen={(nextItem) => setSelectedItemId(nextItem.id)}
                onToggleSaved={handleToggleSaved}
              />
            ))
          )}
        </div>
      </section>
    );
  }

  function renderSettings() {
    return (
      <section className="page-panel">
        <div className="page-title">
          <h1>Settings</h1>
          <Settings size={21} />
        </div>
        <section className="settings-block">
          <h2>LLM Gateway</h2>
          <div className="health-row">
            <div>
              <strong>{llmStatus.label}</strong>
              <span>{llmStatus.message}</span>
            </div>
            <span className={`pill ${llmStatus.status === 'configured' ? 'ok' : 'warn'}`}>
              {llmStatus.status}
            </span>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={isCheckingGateway}
            onClick={handleCheckGateway}
          >
            {isCheckingGateway ? 'Checking...' : 'Check Gateway'}
          </button>
          <p className="muted">OPENAI_API_KEY</p>
          <p className="muted">OPENAI_BASE_URL={llmStatus.safeBaseUrl}</p>
        </section>
        <section className="settings-block" aria-label="Source health">
          <h2>Source Health</h2>
          {Object.values(state.sourceStatuses).map((source) => (
            <div key={source.sourceType} className="health-row">
              <div>
                <strong>{source.label}</strong>
                <span>{source.message}</span>
              </div>
              <span className={`pill ${statusTone(source.status)}`}>{source.status}</span>
            </div>
          ))}
        </section>
        <button
          className="danger-action"
          type="button"
          onClick={() => setState((current) => clearFeedCache(current))}
        >
          Clear feed cache
        </button>
      </section>
    );
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {activeTab === 'today' && renderToday()}
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'keywords' && renderKeywords()}
        {activeTab === 'saved' && renderSaved()}
        {activeTab === 'settings' && renderSettings()}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      {selectedItem ? (
        <DetailSheet
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onToggleSaved={handleToggleSaved}
        />
      ) : null}
    </main>
  );
}
