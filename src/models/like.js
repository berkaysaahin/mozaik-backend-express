
const pool = require('../config/db');

const Like = {
  async likePost(userId, postId) {
    const existsQuery = `
      SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2;
    `;
    const exists = await pool.query(existsQuery, [userId, postId]);

    if (exists.rowCount > 0) {
      throw new Error('Post already liked');
    }

    await pool.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2);',
      [userId, postId]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1;',
      [postId]
    );

    return parseInt(countRes.rows[0].count);
  },

  async unlikePost(userId, postId) {
    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2;',
      [userId, postId]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1;',
      [postId]
    );

    return parseInt(countRes.rows[0].count);
  },
};

module.exports = Like;
