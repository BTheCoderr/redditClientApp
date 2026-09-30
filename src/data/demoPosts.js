export const demoPosts = [
  {
    id:'demo-1', subreddit:'reactjs', author:'pixelpilot', title:'What finally made state management click for me',
    selftext:'I stopped asking which library was best and started mapping where state actually belongs. Most of my app got simpler once server data, URL state, and local UI state stopped fighting each other.',
    score:1842, num_comments:214, created_utc:Date.now()/1000-2700, domain:'self.reactjs', post_hint:'self', demo:true
  },
  {
    id:'demo-2', subreddit:'webdev', author:'shipitdaily', title:'I rebuilt a tiny old project instead of starting another new one',
    selftext:'The surprising part was how much better the portfolio story became. The original idea was still there, but the second pass showed architecture, accessibility, mobile polish, and deployment thinking.',
    score:987, num_comments:103, created_utc:Date.now()/1000-7200, domain:'self.webdev', post_hint:'self', demo:true
  },
  {
    id:'demo-3', subreddit:'programming', author:'cachemiss', title:'A good offline mode is mostly about deciding what failure should feel like',
    selftext:'Caching is the easy part. The product decision is what the user should still be able to do when live data disappears.',
    score:3120, num_comments:341, created_utc:Date.now()/1000-15300, domain:'self.programming', post_hint:'self', demo:true
  },
  {
    id:'demo-4', subreddit:'SideProject', author:'weekendbuilder', title:'What are you building this week?',
    selftext:'Share something small. A fix counts. A landing page counts. Shipping the thing you abandoned six months ago definitely counts.',
    score:624, num_comments:189, created_utc:Date.now()/1000-24600, domain:'self.SideProject', post_hint:'self', demo:true
  },
  {
    id:'demo-5', subreddit:'javascript', author:'tinybundle', title:'The browser platform is quietly replacing half my utility dependencies',
    selftext:'Between URLPattern, structuredClone, Intl, modern form APIs, native dialog, and better fetch primitives, I keep deleting code.',
    score:1436, num_comments:162, created_utc:Date.now()/1000-43100, domain:'self.javascript', post_hint:'self', demo:true
  },
  {
    id:'demo-6', subreddit:'design', author:'marginauto', title:'The best redesign decision was deleting three things',
    selftext:'Every screen had acquired helpful extras until the main action stopped looking important. Removing features restored the hierarchy faster than restyling them.',
    score:2088, num_comments:129, created_utc:Date.now()/1000-62000, domain:'self.design', post_hint:'self', demo:true
  },
  {
    id:'demo-7', subreddit:'technology', author:'signalnoise', title:'Local-first apps feel different even when users never say the words local-first',
    selftext:'Fast startup, no account wall, graceful offline behavior, and data that does not mysteriously disappear all show up as trust.',
    score:2760, num_comments:451, created_utc:Date.now()/1000-79000, domain:'self.technology', post_hint:'self', demo:true
  },
  {
    id:'demo-8', subreddit:'learnprogramming', author:'secondpass', title:'My old code is embarrassing and that turned out to be useful',
    selftext:'It is evidence that I learned something. Rebuilding old projects gave me a clearer picture of what actually improved than another tutorial did.',
    score:1105, num_comments:238, created_utc:Date.now()/1000-103000, domain:'self.learnprogramming', post_hint:'self', demo:true
  }
];

export const demoCommunities = [
  'reactjs','webdev','programming','javascript','SideProject','design','technology','learnprogramming'
];
