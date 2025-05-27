const User = require('../models/user');
const bcrypt = require('bcrypt');
const logger = require('../config/logger');

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
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _, ...userData } = user; 
      res.status(200).json(userData);
    } catch (error) {
      logger.error(`Error logging in user: ${error.message}`);
      res.status(500).json({ error: 'Failed to log in' });
    }
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

