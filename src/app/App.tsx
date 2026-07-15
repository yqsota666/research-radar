import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Bell,
  Bookmark,
  BookmarkCheck,
  Bot,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Github,
  Globe2,
  LibraryBig,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { sourceLabels } from '../domain/demoData';
import { getTodaySummary, getVisibleFeedItems, toggleSaved } from '../domain/radar';
import type { AppState, FeedFilter, KeywordConfig, RadarItem, SourceType } from '../domain/types';
import { runLiveRefresh } from '../services/liveRefresh';
import { checkLlmGateway, getLlmConfigStatus, type LlmEnv } from '../services/llmConfig';
import { suggestRelatedTerms } from '../services/refresh';
import { loadState, saveState } from '../services/storage';

type Tab = 'today' | 'library' | 'settings';
type View = 'main' | 'saved' | 'keywords' | 'sources';
type DisplaySource = 'Paper' | 'GitHub' | 'News' | 'Model';
type RefreshCoordinator = (state: AppState) => Promise<AppState>;

interface RadarSettings {
  autoRefresh: boolean;
  researchAlerts: boolean;
}

export interface AppProps {
  llmEnv?: LlmEnv;
  gatewayFetcher?: typeof fetch;
  refresher?: RefreshCoordinator;
  refreshIntervalMs?: number;
}
const sourceFilters: Array<{ value: FeedFilter['sourceType']; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'paper', label: 'Papers' },
  { value: 'github', label: 'GitHub' },
  { value: 'news', label: 'News' },
  { value: 'huggingface', label: 'Models' },
  { value: 'wechat', label: 'Chinese AI Media' }
];

const defaultRefreshIntervalMs = 15 * 60 * 1000;
const settingsStorageKey = 'research-radar-settings-v1';
const defaultSettings: RadarSettings = {
  autoRefresh: true,
  researchAlerts: false
};

const mojibakePattern = /[�]|鈥|鏈|哄|櫒|涔|績|锛|歊|宸|敤|杩|叆|繁|姘|尯|鍖/;

function getDefaultStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function loadRadarSettings(storage = getDefaultStorage()): RadarSettings {
  if (!storage) return defaultSettings;
  const stored = storage.getItem(settingsStorageKey);
  if (!stored) return defaultSettings;
  try {
    const parsed = JSON.parse(stored) as Partial<RadarSettings>;
    return {
      autoRefresh: typeof parsed.autoRefresh === 'boolean' ? parsed.autoRefresh : defaultSettings.autoRefresh,
      researchAlerts:
        typeof parsed.researchAlerts === 'boolean' ? parsed.researchAlerts : defaultSettings.researchAlerts
    };
  } catch {
    return defaultSettings;
  }
}

function saveRadarSettings(settings: RadarSettings, storage = getDefaultStorage()): void {
  storage?.setItem(settingsStorageKey, JSON.stringify(settings));
}
function cleanText(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length === 0 || mojibakePattern.test(trimmed) ? fallback : trimmed;
}

function sanitizeKeyword(keyword: KeywordConfig): KeywordConfig {
  return {
    ...keyword,
    term: cleanText(keyword.term, 'Research topic'),
    relatedTerms: keyword.relatedTerms.map((term) => cleanText(term, 'related topic')).filter(Boolean)
  };
}

function sanitizeItem(item: RadarItem): RadarItem {
  return {
    ...item,
    title: cleanText(item.title, `${sourceLabels[item.sourceType]} research update`),
    summary: cleanText(item.summary, 'A research signal is available, but the summary needs analysis.'),
    rawSnippet: cleanText(item.rawSnippet, item.summary || 'Research signal'),
    reason: cleanText(item.reason, 'Matches an active research keyword.'),
    tags: item.tags.map((tag) => cleanText(tag, item.matchedKeyword)).filter(Boolean),
    matchedKeyword: cleanText(item.matchedKeyword, 'Research'),
    sourceName: cleanText(item.sourceName, sourceLabels[item.sourceType])
  };
}

function sanitizeState(state: AppState): AppState {
  return {
    ...state,
    keywords: state.keywords.map(sanitizeKeyword),
    items: state.items.map(sanitizeItem),
    sourceStatuses: Object.fromEntries(
      Object.entries(state.sourceStatuses).map(([sourceType, status]) => [
        sourceType,
        {
          ...status,
          label: cleanText(status.label, sourceLabels[status.sourceType]),
          message: cleanText(status.message, 'Source status is available.')
        }
      ])
    ) as AppState['sourceStatuses']
  };
}

function sourceDisplay(sourceType: SourceType): DisplaySource {
  if (sourceType === 'paper') return 'Paper';
  if (sourceType === 'github') return 'GitHub';
  if (sourceType === 'huggingface') return 'Model';
  return 'News';
}

function sourceIcon(source: DisplaySource) {
  return source === 'Paper' ? FileText : source === 'GitHub' ? Github : source === 'Model' ? Bot : Globe2;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function statusTone(status: string): string {
  if (status === 'fetched' || status === 'configured' || status === 'connected') return 'text-[#9fc9b9]';
  if (status === 'cached' || status === 'missing-key' || status === 'invalid-base-url') return 'text-[#d7bb82]';
  if (status === 'failed' || status === 'last-check-failed') return 'text-[#cd7770]';
  return 'text-[#aeb7bd]';
}

function SourceBadge({ sourceType }: { sourceType: SourceType }) {
  const source = sourceDisplay(sourceType);
  const Icon = sourceIcon(source);
  const tones: Record<DisplaySource, string> = {
    Paper: 'text-[#c8dbff] bg-[#32405a]/45',
    GitHub: 'text-[#d9ddd9] bg-[#303333]/70',
    News: 'text-[#efcf9e] bg-[#57472b]/45',
    Model: 'text-[#cfbbe9] bg-[#463855]/50'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] ${tones[source]}`}>
      <Icon size={11} strokeWidth={1.7} />
      {source}
    </span>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[10px] text-[#aaadab]">
      {children}
    </span>
  );
}

function SignalCard({ item, onOpen }: { item: RadarItem; onOpen: () => void }) {
  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer rounded-lg border border-white/[0.075] bg-[linear-gradient(118deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] p-4 shadow-[0_14px_35px_rgba(0,0,0,.14)] transition duration-300 hover:border-[#9fc9b9]/30 hover:bg-white/[0.06]"
    >
      <div className="mb-3 flex items-center justify-between">
        <SourceBadge sourceType={item.sourceType} />
        {item.saved && <BookmarkCheck size={16} className="text-[#b7d9cc]" aria-label="Saved" />}
      </div>
      <h3 className="text-[14px] font-semibold leading-[1.35] text-[#f0efeb]">{item.title}</h3>
      <p className="mt-2 line-clamp-2 text-[12px] leading-[1.55] text-[#a7aaa8]">{item.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </article>
  );
}

function MainNavigation({ tab, navigate }: { tab: Tab; navigate: (next: Tab) => void }) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-8 left-1/2 z-50 flex h-[82px] w-[calc(100%-40px)] max-w-[390px] -translate-x-1/2 items-start justify-around rounded-lg border border-white/[0.07] bg-[#151718]/92 px-6 pt-3 shadow-[0_18px_42px_rgba(0,0,0,.32)] backdrop-blur-xl"
    >
      {(
        [
          { id: 'today', label: 'Today', icon: Sparkles },
          { id: 'library', label: 'Library', icon: LibraryBig },
          { id: 'settings', label: 'Settings', icon: Settings2 }
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => navigate(id)}
          className={`flex min-w-16 flex-col items-center gap-1.5 text-[10px] transition ${tab === id ? 'text-[#b9dccc]' : 'text-[#737975]'}`}
        >
          <span className={`flex size-8 items-center justify-center rounded-lg ${tab === id ? 'bg-[#9fc9b9]/12' : ''}`}>
            <Icon size={18} strokeWidth={tab === id ? 2 : 1.65} />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function Detail({ item, onBack, onSave }: { item: RadarItem; onBack: () => void; onSave: () => void }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 pb-24">
      <button aria-label="Back" onClick={onBack} className="mb-5 flex items-center gap-1.5 text-[12px] text-[#a9aeab]">
        <ArrowLeft size={15} /> Back
      </button>
      <SourceBadge sourceType={item.sourceType} />
      <h1 className="mt-4 font-serif text-[31px] leading-[1.06] text-[#f4f1e9]">{item.title}</h1>
      <p className="mt-3 font-mono text-[10px] text-[#777d79]">
        {item.sourceName} <span className="px-1.5 text-[#525755]">-</span>
        {formatDate(item.publishedAt)}
      </p>
      <div className="mt-7 border-l border-[#9fc9b9]/60 pl-4">
        <p className="text-[15px] leading-[1.6] text-[#d7d8d2]">{item.summary}</p>
      </div>
      <section className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7f8883]">Why it matters</p>
        <p className="mt-2 text-[13px] leading-[1.65] text-[#aaafab]">{item.reason}</p>
      </section>
      <div className="mt-7 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <div className="mt-9 grid grid-cols-2 gap-2">
        <button
          aria-label="Save item"
          onClick={onSave}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#d9e8e1] text-[12px] font-semibold text-[#1c2925]"
        >
          {item.saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          {item.saved ? 'Saved' : 'Save'}
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.11] bg-white/[0.035] text-[12px] text-[#e7e7e1]"
        >
          Open original <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function Today({
  state,
  openDetail,
  autoRefreshEnabled,
  navigation
}: {
  state: AppState;
  openDetail: (item: RadarItem) => void;
  autoRefreshEnabled: boolean;
  navigation: ReactNode;
}) {
  const summary = useMemo(() => getTodaySummary(state), [state]);
  const activeKeywords = state.keywords.filter((keyword) => keyword.enabled).slice(0, 5);

  return (
    <>
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#89908c]">Updated {formatDate(state.lastUpdatedAt)}</p>
        <div className="mt-2 flex items-end justify-between">
          <h1 className="font-serif text-[31px] leading-none text-[#f3f1e9]">
            Research
            <br />
            <em className="text-[#b8d8cb]">Radar</em>
          </h1>
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] text-[#7f8883]">
            <span className="size-1.5 rounded-full bg-[#9fc9b9] shadow-[0_0_8px_#9fc9b9]" />
            {state.isRefreshing ? 'Analyzing' : autoRefreshEnabled ? 'Auto refresh' : 'Manual refresh'}
          </div>
        </div>
      </header>
      {navigation}
      <section className="mt-9 rounded-lg border border-[#a8d1c1]/15 bg-[radial-gradient(circle_at_82%_15%,rgba(121,179,156,.15),transparent_38%),linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.015))] p-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#a8d1c1]">
          <Sparkles size={12} /> Today&apos;s signal
        </div>
        <p className="mt-2.5 font-serif text-[19px] leading-[1.26] text-[#e7e7e0]">
          AI agents, retrieval, and practical research tooling are the strongest signals today.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {activeKeywords.map((keyword) => (
            <Tag key={keyword.id}>{keyword.term}</Tag>
          ))}
        </div>
      </section>
      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#e9e8e2]">Top Matches</h2>
        <span className="font-mono text-[10px] text-[#777e79]">{summary.topMatches.length} selected</span>
      </div>
      <section aria-label="Top matches" className="mt-3 space-y-2.5">
        {summary.topMatches.length ? (
          summary.topMatches.map((item) => <SignalCard key={item.id} item={item} onOpen={() => openDetail(item)} />)
        ) : (
          <EmptyState label="Analyzing research signals..." />
        )}
      </section>
    </>
  );
}

function Library({
  view,
  setView,
  items,
  filter,
  setFilter,
  openDetail,
  navigation
}: {
  view: View;
  setView: (view: View) => void;
  items: RadarItem[];
  filter: FeedFilter;
  setFilter: (filter: FeedFilter) => void;
  openDetail: (item: RadarItem) => void;
  navigation: ReactNode;
}) {
  const isSaved = view === 'saved';
  const visibleItems = isSaved ? items.filter((item) => item.saved) : getVisibleFeedItems(items, filter);

  return (
    <>
      <header className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#89908c]">{isSaved ? 'Reading list' : 'Research inbox'}</p>
          <h1 className="mt-1 font-serif text-[31px] leading-none text-[#f3f1e9]">{isSaved ? 'Saved' : 'Library'}</h1>
        </div>
        {!isSaved && (
          <button aria-label="Saved" onClick={() => setView('saved')} className="rounded-md border border-white/[0.09] p-2 text-[#c9d0cc]">
            <Bookmark size={16} />
          </button>
        )}
      </header>
      {navigation}
      <label className="mt-6 flex h-11 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[#888f8a]">
        <Search size={16} />
        <input
          aria-label="Search library"
          value={filter.query}
          onChange={(event) => setFilter({ ...filter, query: event.target.value })}
          placeholder={isSaved ? 'Search saved' : 'Search research'}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#e8e8e2] outline-none placeholder:text-[#737a76]"
        />
        {filter.query && (
          <button aria-label="Clear search" onClick={() => setFilter({ ...filter, query: '' })}>
            <X size={15} />
          </button>
        )}
      </label>
      {!isSaved && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2">
            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#777e79]">Filter</span>
            <select
              aria-label="Filter source"
              value={filter.sourceType}
              onChange={(event) => setFilter({ ...filter, sourceType: event.target.value as FeedFilter['sourceType'] })}
              className="mt-1 w-full bg-transparent text-[12px] text-[#e8e8e2] outline-none"
            >
              {sourceFilters.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2">
            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#777e79]">Sort</span>
            <select
              aria-label="Sort library"
              value={filter.sortBy}
              onChange={(event) => setFilter({ ...filter, sortBy: event.target.value as FeedFilter['sortBy'] })}
              className="mt-1 w-full bg-transparent text-[12px] text-[#e8e8e2] outline-none"
            >
              <option value="publishedAt">Latest</option>
              <option value="relevance">Best match</option>
              <option value="sourceType">Source</option>
            </select>
          </label>
        </div>
      )}
      {isSaved && (
        <button onClick={() => setView('main')} className="mt-4 flex items-center gap-1 text-[11px] text-[#9fc9b9]">
          <ArrowLeft size={13} /> All research signals
        </button>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#777e79]">{visibleItems.length ? `${visibleItems.length} items` : 'No results'}</span>
        {!isSaved && <SlidersHorizontal size={14} className="text-[#8d9690]" />}
      </div>
      <div className="mt-4 space-y-2.5">
        {visibleItems.length ? (
          visibleItems.map((item) => <SignalCard key={item.id} item={item} onOpen={() => openDetail(item)} />)
        ) : (
          <EmptyState label={isSaved ? 'Saved research will appear here.' : 'No matching research signals.'} />
        )}
      </div>
    </>
  );
}

function Toggle({ on = true, onClick, label }: { on?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      type="button"
      className={`relative h-6 w-10 rounded-full transition ${on ? 'bg-[#9fc9b9]' : 'bg-[#3a3d3d]'}`}
    >
      <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${on ? 'left-5' : 'left-1'}`} />
    </button>
  );
}

function Row({
  icon: Icon,
  title,
  hint,
  onClick,
  children
}: {
  icon?: typeof Settings2;
  title: string;
  hint?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const content = (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[#b6d4c8]">{Icon && <Icon size={14} />}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#e2e3de]">{title}</p>
        {hint && <p className="mt-0.5 text-[11px] text-[#808681]">{hint}</p>}
      </div>
      {children || <ChevronRight size={16} className="text-[#6f7671]" />}
    </>
  );

  if (!onClick) {
    return <div className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]">{content}</div>;
  }

  return (
    <button aria-label={title} onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]">
      {content}
    </button>
  );
}

function Settings({
  view,
  setView,
  state,
  setState,
  llmStatus,
  settings,
  setSettings,
  navigation
}: {
  view: View;
  setView: (view: View) => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  llmStatus: ReturnType<typeof getLlmConfigStatus>;
  settings: RadarSettings;
  setSettings: React.Dispatch<React.SetStateAction<RadarSettings>>;
  navigation: ReactNode;
}) {
  if (view === 'keywords') return <Keywords state={state} setState={setState} onBack={() => setView('main')} />;
  if (view === 'sources') return <Sources state={state} onBack={() => setView('main')} />;
  const activeCount = state.keywords.filter((keyword) => keyword.enabled).length;
  return (
    <>
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#89908c]">Research Radar</p>
        <h1 className="mt-1 font-serif text-[31px] leading-none text-[#f3f1e9]">Settings</h1>
      </header>
      {navigation}
      <div className="mt-8 space-y-6">
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7c847f]">Radar</p>
          <div className="overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.035]">
            <Row icon={Sparkles} title="Keywords" hint={`${activeCount} topics active`} onClick={() => setView('keywords')} />
            <div className="mx-4 border-t border-white/[0.07]" />
            <Row icon={Globe2} title="Sources" hint="Papers, GitHub, News, Models" onClick={() => setView('sources')} />
          </div>
        </section>
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7c847f]">Refresh</p>
          <div className="overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.035]">
            <Row icon={Clock3} title="Auto refresh" hint={`Last updated ${formatDate(state.lastUpdatedAt)}`}>
              <Toggle
                label={settings.autoRefresh ? 'Turn auto refresh off' : 'Turn auto refresh on'}
                on={settings.autoRefresh}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    autoRefresh: !current.autoRefresh
                  }))
                }
              />
            </Row>
          </div>
        </section>
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7c847f]">System</p>
          <div className="overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.035]">
            <Row icon={Bot} title="AI analysis" hint={llmStatus.message}>
              <span className={`flex items-center gap-1.5 font-mono text-[10px] ${statusTone(llmStatus.status)}`}>
                <span className="size-1.5 rounded-full bg-current" />
                {llmStatus.label}
              </span>
            </Row>
            <div className="mx-4 border-t border-white/[0.07]" />
            <Row icon={Bell} title="Research alerts" hint="A quiet daily summary">
              <Toggle
                label={settings.researchAlerts ? 'Turn research alerts off' : 'Turn research alerts on'}
                on={settings.researchAlerts}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    researchAlerts: !current.researchAlerts
                  }))
                }
              />
            </Row>
          </div>
        </section>
      </div>
    </>
  );
}

function Keywords({
  state,
  setState,
  onBack
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onBack: () => void;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const term = cleanText(input, '').trim();
    if (!term || state.keywords.some((keyword) => keyword.term.toLowerCase() === term.toLowerCase())) return;
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
    setInput('');
  };

  return (
    <div className="pb-24">
      <button aria-label="Back to settings" onClick={onBack} className="mb-5 flex items-center gap-1.5 text-[12px] text-[#a9aeab]">
        <ArrowLeft size={15} /> Settings
      </button>
      <h1 className="font-serif text-[31px] leading-none text-[#f3f1e9]">Keywords</h1>
      <div className="mt-6 flex h-11 items-center rounded-lg border border-white/[0.09] bg-white/[0.04] pl-3">
        <input
          aria-label="New keyword"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && add()}
          placeholder="Add research topic"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#737a76]"
        />
        <button aria-label="Add keyword" onClick={add} className="mr-1 flex size-8 items-center justify-center rounded-md bg-[#d9e8e1] text-[#17221f]">
          <Plus size={16} />
        </button>
      </div>
      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.15em] text-[#7c847f]">Tracking {state.keywords.length} topics</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.035]">
        {state.keywords.map((keyword) => (
          <div key={keyword.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[#e7e8e2]">{keyword.term}</p>
              <p className="mt-0.5 text-[11px] text-[#808681]">{keyword.relatedTerms.join(', ')}</p>
            </div>
            <Toggle
              label={keyword.enabled ? `Pause keyword ${keyword.term}` : `Resume keyword ${keyword.term}`}
              on={keyword.enabled}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  keywords: current.keywords.map((entry) => (entry.id === keyword.id ? { ...entry, enabled: !entry.enabled } : entry))
                }))
              }
            />
            <button
              aria-label={`Delete keyword ${keyword.term}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#9aa19d] transition hover:border-[#cd7770]/40 hover:text-[#cd7770]"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  keywords: current.keywords.filter((entry) => entry.id !== keyword.id)
                }))
              }
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sources({ state, onBack }: { state: AppState; onBack: () => void }) {
  return (
    <div>
      <button aria-label="Back to settings" onClick={onBack} className="mb-5 flex items-center gap-1.5 text-[12px] text-[#a9aeab]">
        <ArrowLeft size={15} /> Settings
      </button>
      <h1 className="font-serif text-[31px] leading-none text-[#f3f1e9]">Sources</h1>
      <div className="mt-7 overflow-hidden rounded-lg border border-white/[0.075] bg-white/[0.035]">
        {Object.values(state.sourceStatuses).map((source, index) => (
          <div key={source.sourceType} className={`flex items-center gap-3 px-4 py-4 ${index ? 'border-t border-white/[0.07]' : ''}`}>
            <div className="flex size-7 items-center justify-center rounded-md bg-white/[0.06]">
              <Globe2 size={14} className="text-[#c8d4ce]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[#e4e5df]">{source.label}</p>
              <p className="mt-0.5 text-[11px] text-[#808681]">{source.message}</p>
            </div>
            <span className={`flex items-center gap-1.5 font-mono text-[10px] ${statusTone(source.status)}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {source.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/[0.11] px-6 py-14 text-center">
      <Bookmark size={20} className="mx-auto text-[#64706a]" />
      <p className="mt-3 text-[13px] text-[#b0b4af]">{label}</p>
    </div>
  );
}

export default function App({
  llmEnv = import.meta.env,
  gatewayFetcher = fetch,
  refresher = runLiveRefresh,
  refreshIntervalMs = defaultRefreshIntervalMs
}: AppProps = {}) {
  const [state, setState] = useState<AppState>(() => sanitizeState(loadState()));
  const stateRef = useRef(state);
  const refreshInFlightRef = useRef(false);
  const [tab, setTab] = useState<Tab>('today');
  const [view, setView] = useState<View>('main');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>({ sourceType: 'all', query: '', sortBy: 'publishedAt' });
  const [settings, setSettings] = useState<RadarSettings>(() => loadRadarSettings());
  const [llmStatus, setLlmStatus] = useState(() => getLlmConfigStatus(llmEnv));

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  useEffect(() => {
    saveRadarSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLlmStatus(getLlmConfigStatus(llmEnv));
  }, [llmEnv]);

  useEffect(() => {
    let cancelled = false;
    if (getLlmConfigStatus(llmEnv).status !== 'configured') return undefined;
    checkLlmGateway(llmEnv, gatewayFetcher).then((status) => {
      if (!cancelled && status.status !== 'configured') setLlmStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [gatewayFetcher, llmEnv]);

  const runRefresh = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setState((current) => ({
      ...current,
      isRefreshing: true
    }));
    try {
      const refreshed = await refresher(stateRef.current);
      setState(
        sanitizeState({
          ...refreshed,
          isRefreshing: false
        })
      );
    } catch {
      setState((current) => ({
        ...current,
        isRefreshing: false
      }));
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [refresher]);

  useEffect(() => {
    if (!settings.autoRefresh || refreshIntervalMs <= 0) return undefined;
    const timer = window.setInterval(() => {
      void runRefresh();
    }, refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [refreshIntervalMs, runRefresh, settings.autoRefresh]);

  const detail = detailId ? state.items.find((item) => item.id === detailId) ?? null : null;
  const navigate = (next: Tab) => {
    setTab(next);
    setView('main');
    setDetailId(null);
  };
  const openDetail = (item: RadarItem) => setDetailId(item.id);
  const toggleSave = (itemId: string) => {
    setState((current) => ({ ...current, items: toggleSaved(current.items, itemId) }));
  };
  const navigation = !detail ? <MainNavigation tab={tab} navigate={navigate} /> : null;

  return (
    <main className="min-h-screen bg-[#101112] font-[Manrope] text-[#f2f1ec] md:flex md:items-center md:justify-center md:bg-[radial-gradient(circle_at_50%_0%,#26332f_0%,#101112_48%)]">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[linear-gradient(180deg,#151617_0%,#101112_36%,#101112_100%)] shadow-[0_0_80px_rgba(0,0,0,.55)] md:min-h-[860px] md:rounded-[34px] md:border md:border-white/[0.1]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_at_top,rgba(168,209,193,.07),transparent_65%)]" />
        <div className="relative px-5 pb-40 pt-12">
          {detail ? (
            <Detail
              item={detail}
              onSave={() => toggleSave(detail.id)}
              onBack={() => {
                setDetailId(null);
                setView('main');
              }}
            />
          ) : tab === 'today' ? (
            <Today state={state} openDetail={openDetail} autoRefreshEnabled={settings.autoRefresh} navigation={navigation} />
          ) : tab === 'library' ? (
            <Library view={view} setView={setView} items={state.items} filter={filter} setFilter={setFilter} openDetail={openDetail} navigation={navigation} />
          ) : (
            <Settings
              view={view}
              setView={setView}
              state={state}
              setState={setState}
              llmStatus={llmStatus}
              settings={settings}
              setSettings={setSettings}
              navigation={navigation}
            />
          )}
        </div>
      </div>
    </main>
  );
}
