const pool = require('../config/db');

const Conversation = {
  async create(user1, user2) {
    try {
      const [firstUser, secondUser] = [user1, user2].sort();

      const query = `
        INSERT INTO conversations (user1, user2) 
        VALUES ($1, $2)
        ON CONFLICT (user1, user2) DO NOTHING
        RETURNING *
      `;
      const { rows } = await pool.query(query, [firstUser, secondUser]);
      return rows[0] || this.findByUsers(firstUser, secondUser);
    } catch (error) {
      throw new Error(`Error creating conversation: ${error.message}`);
    }
  },

  async findByUsers(user1, user2) {
    try {
      const [firstUser, secondUser] = [user1, user2].sort();
      const query = 'SELECT * FROM conversations WHERE user1 = $1 AND user2 = $2';
      const { rows } = await pool.query(query, [firstUser, secondUser]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding conversation: ${error.message}`);
    }
  },

  async findById(id) {
    try {
      const query = 'SELECT * FROM conversations WHERE id = $1';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding conversation: ${error.message}`);
    }
  },

  async findByUserId(userId) {
    try {
      const query = `
        SELECT c.*, 
               u1.username as user1_username,
               u2.profile_picture as user2_profile_picture,
               u2.handle as user2_handle,
               u1.profile_picture as user1_profile_picture,
               u1.handle as user1_handle,
               u2.username as user2_username,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
               (SELECT sent_at FROM messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time
        FROM conversations c
        JOIN users u1 ON c.user1 = u1.id
        JOIN users u2 ON c.user2 = u2.id
        WHERE c.user1 = $1 OR c.user2 = $1
        ORDER BY last_message_time DESC NULLS LAST
      `;
      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding user conversations: ${error.message}`);
    }
  },

  async delete(id) {
    try {
      const query = 'DELETE FROM conversations WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error deleting conversation: ${error.message}`);
    }
  }
};

module.exports = Conversation;