const API_PATH='/api/reddit';

const normalizePost = post => ({
  id:post.id,
  name:post.name,
  subreddit:post.subreddit || 'popular',
  author:post.author || 'unknown',
  title:post.title || 'Untitled',
  selftext:post.selftext || '',
  score:Number(post.score || 0),
  num_comments:Number(post.num_comments || 0),
  created_utc:Number(post.created_utc || Date.now()/1000),
  domain:post.domain || '',
  url:post.url_overridden_by_dest || post.url || '',
  permalink:post.permalink || '',
  thumbnail:post.thumbnail && /^https?:/.test(post.thumbnail) ? post.thumbnail : '',
  post_hint:post.post_hint || '',
  over_18:Boolean(post.over_18),
  stickied:Boolean(post.stickied),
  demo:false
});

const request = async params => {
  const url=new URL(API_PATH, window.location.origin);
  Object.entries(params).forEach(([key,value])=>{
    if(value!==undefined && value!==null && value!=='') url.searchParams.set(key,String(value));
  });
  const response=await fetch(url);
  const body=await response.json().catch(()=>({}));
  if(!response.ok) {
    const error=new Error(body.error || 'Reddit connection unavailable');
    error.status=response.status;
    error.configured=body.configured;
    throw error;
  }
  return body;
};

export const fetchFeed = async ({subreddit='popular',sort='hot',after=''}) => {
  const data=await request({kind:'feed',subreddit,sort,after});
  return { posts:(data.posts || []).map(normalizePost), after:data.after || null, configured:true };
};

export const searchPosts = async ({query,subreddit='',sort='relevance'}) => {
  const data=await request({kind:'search',q:query,subreddit,sort});
  return { posts:(data.posts || []).map(normalizePost), configured:true };
};

export const fetchComments = async postId => {
  const data=await request({kind:'comments',postId});
  return data.comments || [];
};
