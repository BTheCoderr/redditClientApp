import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PostList from './components/PostList';
import Post from './components/Post';
import Search from './components/Search';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <div className="app-content">
        <div className="main-content">
          <Search />
          <Routes>
            <Route path="/" element={<PostList />} />
            <Route path="/post/:id" element={<Post />} />
          </Routes>
        </div>
        <Sidebar />
      </div>
      <Footer />
    </Router>
  );
}

export default App;
