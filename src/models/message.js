const pool = require('../config/db');
const Joi = require('joi');

const messageSchema = Joi.object({
  content: Joi.string().required().max(2000),
  conversation_id: Joi.string().required(),
  sender_id: Joi.string().required()
});

const Message = {
  async create(messageData) {
    try {
      const { error } = messageSchema.validate(messageData);
      if (error) throw new Error(error.details[0].message);

      const { content, conversation_id, sender_id } = messageData;

      const query = `
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [conversation_id, sender_id, content]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error creating message: ${error.message}`);
    }
  },

  async findByConversation(conversationId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT m.*, u.username as sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.sent_at DESC
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await pool.query(query, [conversationId, limit, offset]);
      return rows.reverse();
    } catch (error) {
      throw new Error(`Error finding messages: ${error.message}`);
    }
  },

  async markAsSeen(conversationId, userId) {
    try {
      const query = `
        UPDATE messages
        SET seen = true
        WHERE conversation_id = $1 AND sender_id != $2 AND seen = false
        RETURNING *
      `;
      const { rows } = await pool.query(query, [conversationId, userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error marking messages as seen: ${error.message}`);
    }
  },

  async delete(messageId, userId) {
    try {
      const query = `
        DELETE FROM messages 
        WHERE id = $1 AND sender_id = $2
        RETURNING *
      `;
      const { rows } = await pool.query(query, [messageId, userId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error deleting message: ${error.message}`);
    }
  }
};

module.exports = Message;