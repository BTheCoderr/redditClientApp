import React, { useEffect, useState } from 'react';
import { fetchComments } from '../services/reddit';

function Comments({ postId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchComments(postId).then((data) => setComments(data));
  }, [postId]);

  return (
    <div>
      <h2>Comments</h2>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>{comment.body}</li>
        ))}
      </ul>
    </div>
  );
}

export default Comments;
