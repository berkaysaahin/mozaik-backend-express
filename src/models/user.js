const pool = require('../config/db');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const User = {
  async create(userData) {
    try {
      const { error } = userSchema.validate(userData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }
      const { username, email, password } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
      const values = [username, email, hashedPassword];
      const { rows } = await pool.query(query, values);
      return rows[0];
    }
    catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Error creating user: ${error.message}`);
    }

  },

  async deleteUserById(userData) {
    try {
      const { id } = userData;
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);

      return rows[0];
    } catch (error) {
      console.error('Database error:', error); 
      throw new Error( `Failed to delete user: ${error.message}`);
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


  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const { rows } = await pool.query(query, [id]);
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
  
};

module.exports = User;