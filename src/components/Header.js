import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <img src="/logo.png" alt="Logo" />
        <h1>Reddit Minimal</h1>
      </div>
      <div className="header-search">
        <input type="text" placeholder="Search for a subreddit..." />
        <button>Search</button>
      </div>
    </header>
  );
}

export default Header;
