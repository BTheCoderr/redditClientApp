// src/services/reddit.js
import axios from 'axios';

const REDDIT_API_URL = 'https://www.reddit.com/r/';

export const fetchPosts = async (subreddit, after = null) => {
  try {
    const response = await axios.get(`${REDDIT_API_URL}${subreddit}/top.json`, {
      params: { after },
    });
    console.log("API response:", response.data);
    return {
      posts: response.data.data.children.map((child) => child.data),
      after: response.data.data.after,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

export const fetchPostDetails = async (postId) => {
  try {
    const response = await axios.get(`https://www.reddit.com/comments/${postId}.json`);
    return response.data[0].data.children[0].data;
  } catch (error) {
    console.error("Error fetching post details:", error);
    throw error;
  }
};

export const fetchComments = async (postId) => {
  try {
    const response = await axios.get(`https://www.reddit.com/comments/${postId}.json`);
    return response.data[1].data.children.map((child) => child.data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};
