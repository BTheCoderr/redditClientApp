import React from 'react';
import './Sidebar.css';

function Sidebar() {
  const subreddits = [
    { name: 'Home', icon: '/icons/home-icon.png' },
    { name: 'AskReddit', icon: '/icons/askreddit-icon.png' },
    { name: 'NoStupidQuestions', icon: '/icons/nostupidquestions-icon.png' },
    { name: 'BaldursGate3', icon: '/icons/baldursgate3-icon.png' },
    { name: 'facepalm', icon: '/icons/facepalm-icon.png' },
    { name: 'interestingasfuck', icon: '/icons/interestingasfuck-icon.png' },
    { name: 'damnthatsinteresting', icon: '/icons/damnthatsinteresting-icon.png' },
    { name: 'LivestreamFail', icon: '/icons/livestreamfail-icon.png' },
    { name: 'pics', icon: '/icons/pics-icon.png' },
  ];

  return (
    <div className="sidebar">
      <ul>
        {subreddits.map((subreddit) => (
          <li key={subreddit.name}>
            <img src={subreddit.icon} alt={subreddit.name} />
            {subreddit.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
