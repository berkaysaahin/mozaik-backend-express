const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { v4: uuidv4 } = require('uuid');

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: googleName, sub: googleId, picture: googlePicture } = payload;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user = userResult.rows[0];
    let isNewUser = false;

    if (!user) {
      const handle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      const insertResult = await pool.query(
        `INSERT INTO users (
          username, 
          email, 
          password, 
          "createdAt", 
          handle, 
          id, 
          profile_picture, 
          cover, 
          google_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          googleName || email.split('@')[0],
          email,
          null,
          new Date(),
          handle,
          uuidv4(),
          googlePicture || '',
          '',
          googleId
        ]
      );
      user = insertResult.rows[0];
      isNewUser = true;
    } else if (!user.google_id) {

      await pool.query(
        'UPDATE users SET google_id = $1 WHERE id = $2',
        [googleId, user.id]
      );
      user.google_id = googleId;


      if (!user.profile_picture && googlePicture) {
        await pool.query(
          'UPDATE users SET profile_picture = $1 WHERE id = $2',
          [googlePicture, user.id]
        );
        user.profile_picture = googlePicture;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isNewUser
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        handle: user.handle,
        profile_picture: user.profile_picture,
        cover: user.cover,
        isNewUser,
        hasPassword: !!user.password,
        followers: user.followers,
        following: user.following,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error('Google auth error:', error.stack || error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});


router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;