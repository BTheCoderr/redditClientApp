import { useEffect, useMemo, useState } from 'react';
import { demoCommunities, demoPosts } from './data/demoPosts.js';
import { fetchComments, fetchFeed, searchPosts } from './services/reddit.js';

const STORAGE_KEY = 'threadline-v2';

const defaultLocal = {
  saved: [],
  followed: ['reactjs', 'webdev', 'programming'],
  history: [],
  recentSearches: [],
  theme: 'dark',
  density: 'comfortable',
};

const loadLocal = () => {
  try {
    return { ...defaultLocal, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultLocal;
  }
};

const formatNumber = value =>
  new Intl.NumberFormat(undefined, { notation: value > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value || 0);

const timeAgo = seconds => {
  const diff = Math.max(1, Math.floor(Date.now() / 1000 - Number(seconds || 0)));
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const safeCommunity = value => String(value || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);

function App() {
  const [local, setLocal] = useState(loadLocal);
  const [posts, setPosts] = useState(demoPosts);
  const [sourceMode, setSourceMode] = useState('checking');
  const [sourceMessage, setSourceMessage] = useState('Checking Reddit connection…');
  const [community, setCommunity] = useState('popular');
  const [sort, setSort] = useState('hot');
  const [tab, setTab] = useState('feed');
  const [query, setQuery] = useState('');
  const [searchLabel, setSearchLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  }, [local]);

  useEffect(() => {
    const actualTheme = local.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : local.theme;
    document.documentElement.dataset.theme = actualTheme;
    document.documentElement.dataset.density = local.density;
  }, [local.theme, local.density]);

  useEffect(() => {
    const onInstall = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);

  const fallbackToDemo = (message = 'Demo mode · Reddit OAuth is not configured yet.') => {
    setSourceMode('demo');
    setSourceMessage(message);
    setPosts(demoPosts);
  };

  const load = async ({ targetCommunity = community, targetSort = sort } = {}) => {
    setLoading(true);
    setSearchLabel('');
    try {
      const result = await fetchFeed({ subreddit: targetCommunity, sort: targetSort });
      setPosts(result.posts.filter(post => !post.over_18));
      setSourceMode('live');
      setSourceMessage('Live Reddit data · authenticated server connection');
    } catch (error) {
      fallbackToDemo(
        error.configured === false
          ? 'Demo mode · add Reddit OAuth credentials in Netlify to enable live data.'
          : 'Demo mode · the live Reddit connection is temporarily unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ targetCommunity: 'popular', targetSort: 'hot' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayPosts = useMemo(() => {
    if (tab === 'saved') return posts.filter(post => local.saved.includes(post.id));
    if (tab === 'history') {
      const order = new Map(local.history.map((item, index) => [item.id, index]));
      return posts.filter(post => order.has(post.id)).sort((a, b) => order.get(a.id) - order.get(b.id));
    }

    if (sourceMode === 'demo' && community !== 'popular') {
      return posts.filter(post => post.subreddit.toLowerCase() === community.toLowerCase());
    }
    return posts;
  }, [posts, tab, local.saved, local.history, sourceMode, community]);

  const communities = useMemo(() => {
    const fromPosts = posts.map(post => post.subreddit);
    return [...new Set([...local.followed, ...demoCommunities, ...fromPosts])].filter(Boolean);
  }, [posts, local.followed]);

  const setCommunityAndLoad = next => {
    const clean = next === 'popular' ? 'popular' : safeCommunity(next);
    setCommunity(clean || 'popular');
    setTab('feed');
    setSidebarOpen(false);

    if (sourceMode === 'live') {
      load({ targetCommunity: clean || 'popular', targetSort: sort });
    } else {
      setSearchLabel('');
      setPosts(demoPosts);
    }
  };

  const runSearch = async event => {
    event?.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setTab('feed');
    setSearchLabel(clean);
    setLocal(prev => ({
      ...prev,
      recentSearches: [clean, ...prev.recentSearches.filter(item => item !== clean)].slice(0, 6),
    }));

    if (sourceMode === 'live') {
      try {
        const result = await searchPosts({ query: clean, subreddit: community === 'popular' ? '' : community });
        setPosts(result.posts.filter(post => !post.over_18));
      } catch {
        setSourceMessage('Live search failed · showing matching demo posts instead.');
        setSourceMode('demo');
        setPosts(demoPosts.filter(post =>
          `${post.title} ${post.selftext} ${post.subreddit}`.toLowerCase().includes(clean.toLowerCase())
        ));
      }
    } else {
      setPosts(demoPosts.filter(post =>
        `${post.title} ${post.selftext} ${post.subreddit}`.toLowerCase().includes(clean.toLowerCase())
      ));
    }

    setLoading(false);
  };

  const openPost = async post => {
    setSelectedPost(post);
    setComments([]);
    setLocal(prev => ({
      ...prev,
      history: [
        { id: post.id, title: post.title, subreddit: post.subreddit, openedAt: Date.now() },
        ...prev.history.filter(item => item.id !== post.id),
      ].slice(0, 30),
    }));

    if (sourceMode !== 'live' || post.demo) return;

    setCommentsLoading(true);
    try {
      setComments(await fetchComments(post.id));
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleSave = postId => {
    setLocal(prev => ({
      ...prev,
      saved: prev.saved.includes(postId)
        ? prev.saved.filter(id => id !== postId)
        : [postId, ...prev.saved],
    }));
  };

  const toggleFollow = subreddit => {
    setLocal(prev => ({
      ...prev,
      followed: prev.followed.includes(subreddit)
        ? prev.followed.filter(item => item !== subreddit)
        : [...prev.followed, subreddit],
    }));
  };

  const changeSort = next => {
    setSort(next);
    if (sourceMode === 'live' && !searchLabel) load({ targetCommunity: community, targetSort: next });
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">☰</button>
        <button className="brand" type="button" onClick={() => setCommunityAndLoad('popular')}>
          <span className="brand-mark">t/</span>
          <span><strong>Threadline</strong><small>community reader</small></span>
        </button>

        <form className="search" onSubmit={runSearch}>
          <span>⌕</span>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search communities and posts"
            aria-label="Search communities and posts"
          />
          {query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </form>

        <div className="top-actions">
          <button className="icon-button" type="button" onClick={() => setLocal(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}>
            {local.theme === 'dark' ? '☀' : '☾'}
          </button>
          {installPrompt && <button className="install-button" type="button" onClick={installApp}>Install</button>}
        </div>
      </header>

      <div className="app-grid">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-mobile-head">
            <strong>Browse</strong>
            <button onClick={() => setSidebarOpen(false)}>×</button>
          </div>

          <nav className="main-nav">
            <button className={tab === 'feed' ? 'active' : ''} onClick={() => { setTab('feed'); setCommunityAndLoad('popular'); }}>
              <span>⌂</span> Home
            </button>
            <button className={tab === 'saved' ? 'active' : ''} onClick={() => { setTab('saved'); setSidebarOpen(false); }}>
              <span>◇</span> Saved <em>{local.saved.length}</em>
            </button>
            <button className={tab === 'history' ? 'active' : ''} onClick={() => { setTab('history'); setSidebarOpen(false); }}>
              <span>↺</span> History
            </button>
          </nav>

          <div className="sidebar-section">
            <div className="section-title"><span>Following</span><small>{local.followed.length}</small></div>
            {local.followed.map(item => (
              <button key={item} className={community === item && tab === 'feed' ? 'community active' : 'community'} onClick={() => setCommunityAndLoad(item)}>
                <span className="community-dot">{item.slice(0, 1).toUpperCase()}</span>
                <span>r/{item}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="section-title"><span>Recent searches</span></div>
            {local.recentSearches.length ? local.recentSearches.map(item => (
              <button key={item} className="recent-search" onClick={() => { setQuery(item); setTimeout(() => document.querySelector('.search')?.requestSubmit(), 0); }}>
                <span>⌕</span>{item}
              </button>
            )) : <p className="muted-copy">Searches stay on this device.</p>}
          </div>

          <div className="sidebar-footer">
            <span className={`status-dot ${sourceMode}`}></span>
            <div><strong>{sourceMode === 'live' ? 'Live Reddit' : sourceMode === 'checking' ? 'Connecting' : 'Demo mode'}</strong><small>{sourceMode === 'live' ? 'OAuth connected' : 'Local sample feed'}</small></div>
          </div>
        </aside>

        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

        <main className="feed">
          <section className="feed-header">
            <div>
              <span className="eyebrow">{tab === 'feed' ? (searchLabel ? 'SEARCH' : 'COMMUNITY FEED') : tab.toUpperCase()}</span>
              <h1>
                {tab === 'saved' ? 'Saved posts' :
                 tab === 'history' ? 'Reading history' :
                 searchLabel ? `“${searchLabel}”` :
                 community === 'popular' ? 'Your front page' : `r/${community}`}
              </h1>
              <p>{sourceMessage}</p>
            </div>
            {tab === 'feed' && (
              <div className="sort-tabs">
                {['hot', 'new', 'top', 'rising'].map(item => (
                  <button key={item} className={sort === item ? 'active' : ''} onClick={() => changeSort(item)}>{item}</button>
                ))}
              </div>
            )}
          </section>

          {sourceMode === 'demo' && (
            <section className="demo-banner">
              <div>
                <strong>Demo mode is intentional.</strong>
                <span>The cards below are sample content, not copied Reddit posts. Add Reddit OAuth credentials in Netlify when you want the real feed.</span>
              </div>
              <button onClick={() => load({ targetCommunity: community, targetSort: sort })}>Retry live</button>
            </section>
          )}

          {loading && <div className="loading-card"><span></span><span></span><span></span></div>}

          {!loading && displayPosts.length === 0 && (
            <div className="empty-card">
              <div>∅</div>
              <h2>Nothing here yet</h2>
              <p>{tab === 'saved' ? 'Save a post and it will live here on this device.' : tab === 'history' ? 'Open a post and your recent reading will appear here.' : 'Try another search or community.'}</p>
            </div>
          )}

          <div className="post-list">
            {displayPosts.map(post => (
              <article key={post.id} className="post-card">
                <div className="vote-column">
                  <span>▲</span><strong>{formatNumber(post.score)}</strong><span>▼</span>
                </div>

                <div className="post-body">
                  <div className="post-meta">
                    <button onClick={() => setCommunityAndLoad(post.subreddit)}>r/{post.subreddit}</button>
                    <span>·</span><span>u/{post.author}</span><span>·</span><span>{timeAgo(post.created_utc)}</span>
                    {post.stickied && <em>pinned</em>}
                    {post.demo && <em>demo</em>}
                  </div>

                  <button className="post-title" type="button" onClick={() => openPost(post)}>{post.title}</button>
                  {post.selftext && <p className="post-preview">{post.selftext}</p>}
                  {post.thumbnail && <img className="post-thumb" src={post.thumbnail} alt="" loading="lazy" />}

                  <div className="post-actions">
                    <button onClick={() => openPost(post)}><span>▢</span>{formatNumber(post.num_comments)} comments</button>
                    <button className={local.saved.includes(post.id) ? 'saved' : ''} onClick={() => toggleSave(post.id)}>
                      <span>{local.saved.includes(post.id) ? '◆' : '◇'}</span>{local.saved.includes(post.id) ? 'Saved' : 'Save'}
                    </button>
                    <button onClick={() => navigator.clipboard?.writeText(post.demo ? window.location.href : `https://www.reddit.com${post.permalink}`)}>
                      <span>↗</span>Share
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="right-rail">
          <section className="rail-card source-card">
            <span className="eyebrow">DATA SOURCE</span>
            <h2>{sourceMode === 'live' ? 'Reddit is connected' : 'Local demo feed'}</h2>
            <p>{sourceMode === 'live'
              ? 'Requests go through the server-side OAuth adapter. Credentials never ship to the browser.'
              : 'The app stays useful without credentials and clearly labels all sample content.'}</p>
            <div className="source-status"><span className={`status-dot ${sourceMode}`}></span>{sourceMode === 'live' ? 'Authenticated' : 'Credential-free'}</div>
          </section>

          <section className="rail-card">
            <div className="rail-head"><span className="eyebrow">DISCOVER</span><small>{communities.length}</small></div>
            <h2>Communities</h2>
            <div className="discover-list">
              {communities.slice(0, 7).map(item => {
                const following = local.followed.includes(item);
                return (
                  <div key={item} className="discover-row">
                    <button className="discover-community" onClick={() => setCommunityAndLoad(item)}>
                      <span>{item.slice(0, 1).toUpperCase()}</span>
                      <div><strong>r/{item}</strong><small>community</small></div>
                    </button>
                    <button className={following ? 'follow active' : 'follow'} onClick={() => toggleFollow(item)}>{following ? '✓' : '+'}</button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rail-card settings-card">
            <span className="eyebrow">LOCAL SETTINGS</span>
            <h2>Your reader</h2>
            <label><span>Theme</span><select value={local.theme} onChange={event => setLocal(prev => ({ ...prev, theme: event.target.value }))}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
            <label><span>Density</span><select value={local.density} onChange={event => setLocal(prev => ({ ...prev, density: event.target.value }))}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
            <p>Saved posts, follows, history, searches, and settings stay in your browser.</p>
          </section>
        </aside>
      </div>

      {selectedPost && (
        <div className="reader-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedPost(null); }}>
          <section className="reader" role="dialog" aria-modal="true" aria-label={selectedPost.title}>
            <header className="reader-head">
              <div><span>r/{selectedPost.subreddit}</span><small>u/{selectedPost.author} · {timeAgo(selectedPost.created_utc)}</small></div>
              <button onClick={() => setSelectedPost(null)} aria-label="Close post">×</button>
            </header>
            <div className="reader-content">
              <h2>{selectedPost.title}</h2>
              {selectedPost.selftext ? <p>{selectedPost.selftext}</p> : <p className="muted-copy">This post links to external content.</p>}
              <div className="reader-actions">
                <button className={local.saved.includes(selectedPost.id) ? 'primary-action' : ''} onClick={() => toggleSave(selectedPost.id)}>
                  {local.saved.includes(selectedPost.id) ? '◆ Saved' : '◇ Save'}
                </button>
                <a href={selectedPost.demo ? `https://www.reddit.com/r/${selectedPost.subreddit}/` : `https://www.reddit.com${selectedPost.permalink}`} target="_blank" rel="noreferrer">
                  Open on Reddit ↗
                </a>
              </div>

              <div className="comments-head"><h3>Comments</h3><span>{formatNumber(selectedPost.num_comments)}</span></div>
              {selectedPost.demo || sourceMode !== 'live' ? (
                <div className="comment-placeholder">
                  <strong>Comments appear in Live mode.</strong>
                  <p>Demo content is local, so there is no fake discussion attached to it.</p>
                </div>
              ) : commentsLoading ? (
                <div className="comment-placeholder"><strong>Loading discussion…</strong></div>
              ) : comments.length ? comments.map(comment => (
                <article key={comment.id} className="comment">
                  <div><strong>u/{comment.author}</strong><span>{formatNumber(comment.score)} pts · {timeAgo(comment.created_utc)}</span></div>
                  <p>{comment.body}</p>
                </article>
              )) : (
                <div className="comment-placeholder"><strong>No comments loaded.</strong><p>The thread may be empty or temporarily unavailable.</p></div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
