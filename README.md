# Threadline for Reddit

<!-- repo-intro:start -->
**Project snapshot:** Threadline for Reddit is a modern React reader that revives an older Reddit client with a current Vite stack, local-first reading features, and a server-side OAuth boundary for live Reddit data.

**What it demonstrates:** React · Vite · Netlify Functions · OAuth-aware API design · PWA.
<!-- repo-intro:end -->

A modern revival of the original `redditClientApp`.

The original project was a Create React App prototype that fetched Reddit's public `.json` endpoints directly from the browser, hard-coded `r/reactjs`, and had incomplete search/comments/navigation. Threadline keeps the community-reader idea but rebuilds the product and data boundary for current Reddit access rules.

## What changed

### Modern frontend
- React 19.3
- Vite 8.3
- Responsive desktop/mobile layout
- Dark/light/system appearance
- Comfortable/compact density
- Installable PWA + offline app shell

### Reader features
- Home feed
- Community browsing
- Search
- Hot / New / Top / Rising sorting
- Saved posts with local snapshots
- Reading history with local snapshots
- Followed communities
- Recent searches
- Post reader drawer
- Live comments when Reddit is connected
- External "Open on Reddit" links

### Local-first behavior

These preferences live in browser `localStorage` under `threadline-v2`:
- saved posts
- followed communities
- reading history
- recent searches
- theme
- density

No account or database is required.

## Demo mode

The app is intentionally usable without Reddit credentials. In Demo Mode it displays clearly labeled sample posts from `src/data/demoPosts.js`.

The sample posts are original placeholder content. They are **not scraped or copied Reddit posts**.

## Live Reddit mode

Reddit's current Data API rules require registered OAuth access. Threadline therefore does **not** call Reddit's legacy public JSON endpoints directly from the browser.

Live data flows through `netlify/functions/reddit.mts`:

1. The server function reads Reddit credentials from Netlify environment variables.
2. It requests an application-only OAuth token.
3. It calls `https://oauth.reddit.com`.
4. It returns only the feed/search/comment data needed by the UI.
5. Client secrets never ship to the browser.

Required environment variables:

```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=web:threadline-reader:v2.0 (by /u/YOUR_REDDIT_USERNAME)
```

Use credentials from a Reddit Data API app that has been registered/approved for your use case and follow Reddit's Developer Terms, Data API Terms, and rate limits.

If these variables are missing, the function returns a controlled `503` and the UI automatically falls back to Demo Mode.

## Development

```bash
npm install
npm run dev
```

For full local Netlify Function behavior, use Netlify's local development tooling with the environment variables above.

## Production

`netlify.toml` builds the Vite app into `dist/` and deploys the Reddit proxy from `netlify/functions/`.

No database is required.

## Privacy

A basic app-specific privacy disclosure is available at `/privacy.html`. It documents local browser storage and the on-demand Reddit proxy behavior.
