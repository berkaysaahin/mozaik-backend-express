const User = require('../models/user');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userController = {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        created_at: new Date(),
      });

      res.status(201).json(user);
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;

      const updatedUser = await User.updateUserProfile(userId, updates);

      const { password: _, ...userData } = updatedUser;
      res.status(200).json(userData);
    } catch (error) {
      logger.error(`Error updating profile: ${error.message}`);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },


  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const deletedUser = await User.deleteUserById({ id });

      res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },
  async oauthCallback(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'OAuth failed' });
      }

      const token = generateToken(req.user);

      res.json({
        user: req.user,
        token
      });
    } catch (error) {
      logger.error(`OAuth error: ${error.message}`);
      res.status(500).json({ error: 'OAuth failed' });
    }
  },

  async login(req, res) {
    const { user, pwd } = req.body;
    if (!user || !pwd) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
      const result = await pool.query(
        'SELECT id, username, email, password, refresh_token FROM users WHERE username = $1 OR email = $1 LIMIT 1',
        [user]
      );
      const foundUser = result.rows[0];

      if (!foundUser) {
        return res.sendStatus(401);
      }

      const match = await bcrypt.compare(pwd, foundUser.password);
      if (!match) {
        return res.sendStatus(401);
      }

      const accessToken = jwt.sign(
        { username: foundUser.username, userId: foundUser.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '60s' }
      );

      const refreshToken = jwt.sign(
        { username: foundUser.username, userId: foundUser.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
      );

      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, foundUser.id]
      );

      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({ accessToken });

    } catch (error) {
      console.error('Login error:', error);
      res.sendStatus(500);
    }
  },
  async logoutHandler(req, res) {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;
    await pool.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.sendStatus(204);
  },

  async getUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'USERID is required' });
      }

      let user;
      if (userId) {
        user = await User.findById(userId);
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      logger.error(`Error fetching user: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userData } = user;
        return userData;
      });

      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      logger.error(`Error fetching all users: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },
};

module.exports = userController;

