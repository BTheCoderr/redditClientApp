
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPostDetails } from '../services/reddit';
import styles from './Post.module.css';

function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPostDetails(id)
      .then((data) => setPost(data))
      .catch((error) => setError('Failed to fetch post details.'));
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!post) return <div>Loading...</div>;

  return (
    <div className={styles.postContainer}>
      <h1 className={styles.postTitle}>{post.title}</h1>
      <div className={styles.postContent}>{post.selftext}</div>
    </div>
  );
}

export default Post;
