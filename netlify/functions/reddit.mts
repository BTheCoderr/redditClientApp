import type { Config, Context } from '@netlify/functions';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=30, s-maxage=60' : 'no-store',
    },
  });

const cleanSubreddit = (value: string | null) => {
  const subreddit = (value || 'popular').trim();
  return /^[A-Za-z0-9_]{2,32}$/.test(subreddit) ? subreddit : 'popular';
};

const cleanSort = (value: string | null, allowed: string[], fallback: string) =>
  value && allowed.includes(value) ? value : fallback;

const getCredentials = () => ({
  clientId: Netlify.env.get('REDDIT_CLIENT_ID') || '',
  clientSecret: Netlify.env.get('REDDIT_CLIENT_SECRET') || '',
  userAgent: Netlify.env.get('REDDIT_USER_AGENT') || '',
});

const getToken = async (clientId: string, clientSecret: string, userAgent: string) => {
  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${authorization}`,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': userAgent,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) throw new Error(`OAuth token request failed (${response.status})`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('OAuth token response did not include an access token');
  return body.access_token;
};

const redditFetch = async (path: string, token: string, userAgent: string) => {
  const response = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      authorization: `bearer ${token}`,
      'user-agent': userAgent,
    },
  });

  if (!response.ok) throw new Error(`Reddit API request failed (${response.status})`);
  return response.json();
};

const listingToPosts = (payload: any) =>
  (payload?.data?.children || [])
    .map((child: any) => child?.data)
    .filter(Boolean)
    .slice(0, 30);

export default async (req: Request, _context: Context) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const { clientId, clientSecret, userAgent } = getCredentials();
  if (!clientId || !clientSecret || !userAgent) {
    return json({
      error: 'Reddit OAuth is not configured for this deployment.',
      configured: false,
    }, 503);
  }

  try {
    const token = await getToken(clientId, clientSecret, userAgent);
    const url = new URL(req.url);
    const kind = url.searchParams.get('kind') || 'feed';

    if (kind === 'feed') {
      const subreddit = cleanSubreddit(url.searchParams.get('subreddit'));
      const sort = cleanSort(url.searchParams.get('sort'), ['hot','new','top','rising'], 'hot');
      const after = (url.searchParams.get('after') || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 30);
      const params = new URLSearchParams({ limit: '24', raw_json: '1' });
      if (after) params.set('after', after);
      if (sort === 'top') params.set('t', 'day');

      const payload = await redditFetch(`/r/${subreddit}/${sort}?${params}`, token, userAgent);
      return json({
        configured: true,
        posts: listingToPosts(payload),
        after: payload?.data?.after || null,
      });
    }

    if (kind === 'search') {
      const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
      if (!query) return json({ configured: true, posts: [] });

      const subredditRaw = url.searchParams.get('subreddit');
      const subreddit = subredditRaw ? cleanSubreddit(subredditRaw) : '';
      const sort = cleanSort(url.searchParams.get('sort'), ['relevance','hot','top','new','comments'], 'relevance');
      const base = subreddit ? `/r/${subreddit}/search` : '/search';
      const params = new URLSearchParams({
        q: query,
        sort,
        limit: '30',
        raw_json: '1',
        restrict_sr: subreddit ? '1' : '0',
      });

      const payload = await redditFetch(`${base}?${params}`, token, userAgent);
      return json({ configured: true, posts: listingToPosts(payload) });
    }

    if (kind === 'comments') {
      const postId = (url.searchParams.get('postId') || '').trim();
      if (!/^[A-Za-z0-9]{3,12}$/.test(postId)) return json({ error: 'Invalid post id' }, 400);

      const payload = await redditFetch(`/comments/${postId}?limit=40&depth=2&raw_json=1`, token, userAgent);
      const comments = (payload?.[1]?.data?.children || [])
        .map((child: any) => child?.data)
        .filter((comment: any) => comment?.body && comment?.author)
        .slice(0, 40)
        .map((comment: any) => ({
          id: comment.id,
          author: comment.author,
          body: comment.body,
          score: Number(comment.score || 0),
          created_utc: Number(comment.created_utc || 0),
        }));
      return json({ configured: true, comments });
    }

    return json({ error: 'Unknown request kind' }, 400);
  } catch (error) {
    console.error('Threadline Reddit proxy error', error);
    return json({
      error: 'Reddit is temporarily unavailable through this reader.',
      configured: true,
    }, 502);
  }
};

export const config: Config = {
  path: '/api/reddit',
};
