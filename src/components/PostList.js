import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../services/reddit';
import styles from './PostList.module.css';
import './PostList.css';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [after, setAfter] = useState(null);

  const loadMorePosts = useCallback(() => {
    setLoading(true);
    fetchPosts('reactjs', after)
      .then((data) => {
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
        setAfter(data.after);
        setLoading(false);
      })
      .catch((error) => {
        setError('Failed to fetch posts. Please try again later.');
        setLoading(false);
      });
  }, [after]);

  useEffect(() => {
    loadMorePosts();
  }, [loadMorePosts]);

  if (loading && !posts.length) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      <ul className={styles.postList}>
        {posts.map((post, index) => (
          <li key={`${post.id}-${index}`} className={styles.postItem}>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
            {post.thumbnail && post.thumbnail !== 'self' && (
              <img src={post.thumbnail} alt={post.title} />
            )}
          </li>
        ))}
      </ul>
      {loading && <div>Loading more posts...</div>}
      {!loading && after && <button onClick={loadMorePosts}>Load More</button>}
    </div>
  );
}

export default PostList;
