const pool = require('../config/db');

const Post = {
  async create({ user_id, content, music = null, visibility, image_url = null }) {
    const query = `
      INSERT INTO posts (user_id, content, music, visibility, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [user_id, content, music, visibility, image_url];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
  async findAll(currentUserId) {
    const query = `
      SELECT 
        posts.*, 
        users.username, 
        users.handle, 
        users.profile_picture,
        users.id AS user_id,
        -- Like count for each post
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        -- Reblog count for each post
        (SELECT COUNT(*) FROM reblog WHERE reblog.post_id = posts.id) AS reblog_count,
        -- Check if the current user liked the post
        EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = $1) AS has_liked,
        -- Check if the current user reblogged the post
        EXISTS (SELECT 1 FROM reblog WHERE reblog.post_id = posts.id AND reblog.user_id = $1) AS has_reblogged
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.timestamp DESC;
    `;
    const { rows } = await pool.query(query, [currentUserId]);
    return rows;
  },
  async findPostsByUserId(id, currentUserId) {

    const query = `
      SELECT 
        posts.*,
        users.username,
        users.handle,
        users.profile_picture,
        users.id AS user_id,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM reblog WHERE reblog.post_id = posts.id) AS reblog_count,
        EXISTS (SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = $2) AS has_liked,
        EXISTS (SELECT 1 FROM reblog WHERE reblog.post_id = posts.id AND reblog.user_id = $2) AS has_reblogged
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE users.id = $1
      ORDER BY posts.timestamp DESC;
    `;

    const { rows } = await pool.query(query, [id, currentUserId]);


    return rows;
  },
  

  async delete(id) {
    const query = 'DELETE FROM posts WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

module.exports = Post;