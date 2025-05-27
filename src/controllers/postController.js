const Post = require('../models/post');
const { getSimplifiedTrackDetails } = require('../config/spotify');

const postController = {

  async createPost(req, res) {
    try {
      const { user_id, content, spotify_track_id, visibility, image_url } = req.body;

      let music = null;
      if (spotify_track_id) {
        const trackDetails = await getSimplifiedTrackDetails(spotify_track_id);

        music = {
          spotify_track_id,
          ...trackDetails,
        };
      }

      const post = await Post.create({ user_id, content, music: music || null, visibility, image_url: image_url || null, });
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  },


  async getAllPosts(req, res) {
    try {
      const userId = req.query.user_id;

      if (!userId) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const posts = await Post.findAll(userId);



      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.status(200).json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  },

  async getUserPostsById(req, res) {
    try {
      const { id } = req.params;

      const posts = await Post.findPostsByUserId(id);

      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const post = await Post.update(id, action);
      res.status(200).json(post);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  },

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const deletedPost = await Post.delete(id);

      if (!deletedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.status(200).json({ message: 'Post deleted successfully', deletedPost });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  },
};

module.exports = postController;
