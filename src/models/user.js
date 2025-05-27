const pool = require('../config/db');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).optional(),
  googleId: Joi.string().optional()
});

const User = {
  async create(userData) {
    try {
      const { error } = userSchema.validate(userData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }
      const { username, email, password, googleId } = userData;
      let hashedPassword = null;

      if (googleId) {
        hashedPassword = null;
      } else if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
      const values = [username, email, hashedPassword, googleId || null];
      const { rows } = await pool.query(query, values);
      return rows[0];
    }
    catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Error creating user: ${error.message}`);
    }

  },

  async findByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const { rows } = await pool.query(query, [googleId]);
    return rows[0];
  },

  async deleteUserById(userData) {
    try {
      const { id } = userData;
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);

      return rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    console.log(rows)
    return rows[0];
  },
  async findByHandle(handle) {
    try {
      const query = 'SELECT * FROM users WHERE handle = $1 LIMIT 1';
      const { rows } = await pool.query(query, [handle]);

      if (rows.length === 0) {
        throw new Error('User not found');
      }

      return rows[0];
    } catch (error) {

      console.error('Error fetching user by handle:', error.message);
      throw error;
    }
  },


  async findById(userId) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const { rows } = await pool.query(query, [userId]);
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error.message);
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  },

  async findAll(limit = 10, offset = 0) {
    try {
      const query = 'SELECT * FROM users LIMIT $1 OFFSET $2';
      const { rows } = await pool.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding all users: ${error.message}`);
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if (updates.username) {
        setClauses.push(`username = $${paramIndex++}`);
        values.push(updates.username);
      }
      if (updates.profile_picture) {
        setClauses.push(`profile_picture = $${paramIndex++}`);
        values.push(updates.profile_picture);
      }
      if (updates.cover) {
        setClauses.push(`cover = $${paramIndex++}`);
        values.push(updates.cover);
      }
      if (updates.bio) {
        setClauses.push(`bio = $${paramIndex++}`);
        values.push(updates.bio);
      }
      if (updates.handle) {
        setClauses.push(`handle = $${paramIndex++}`);
        values.push(updates.handle);
      }
      if (updates.email) {
        setClauses.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClauses.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      const query = `
          UPDATE users 
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
      values.push(userId);

      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

};

module.exports = User;